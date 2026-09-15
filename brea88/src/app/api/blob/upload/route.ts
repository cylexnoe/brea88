import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  hasValidContentLength,
  validateImageFile,
} from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Creates a BREA 88 watermark using the actual
 * LOGO.png image.
 *
 * IMPORTANT:
 * - No SVG
 * - No text rendering
 * - No fonts
 * - No generated characters
 *
 * This completely avoids the □□□□ problem.
 */
async function createWatermark(
  width: number,
  height: number,
): Promise<{
  input: Buffer;
  left: number;
  top: number;
}> {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'img',
    'LOGO.png',
  );

  /*
   * Make sure the logo exists.
   */
  try {
    await fs.access(logoPath);
  } catch {
    throw new Error(
      'BREA 88 watermark logo was not found at public/img/LOGO.png',
    );
  }

  const logoBuffer = await fs.readFile(logoPath);

  /*
   * Read the REAL logo dimensions.
   */
  const logoMetadata =
    await sharp(logoBuffer).metadata();

  if (
    !logoMetadata.width ||
    !logoMetadata.height
  ) {
    throw new Error(
      'Unable to determine BREA 88 logo dimensions.',
    );
  }

  /*
   * Determine watermark size based on the
   * uploaded property's dimensions.
   */
  const shortestSide =
    Math.min(width, height);

  const desiredWidth = Math.round(
    shortestSide * 0.20,
  );

  const logoWidth = Math.max(
    140,
    Math.min(320, desiredWidth),
  );

  /*
   * Let Sharp calculate the actual height.
   *
   * This is important because we must use
   * the REAL output dimensions later.
   */
  const resizedLogoBuffer =
    await sharp(logoBuffer)
      .resize({
        width: logoWidth,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .ensureAlpha()
      .png()
      .toBuffer();

  /*
   * Get the ACTUAL resized dimensions.
   *
   * Do not assume they are the same as the
   * requested dimensions.
   */
  const resizedMetadata =
    await sharp(resizedLogoBuffer).metadata();

  if (
    !resizedMetadata.width ||
    !resizedMetadata.height
  ) {
    throw new Error(
      'Unable to determine resized BREA 88 logo dimensions.',
    );
  }

  const actualWidth =
    resizedMetadata.width;

  const actualHeight =
    resizedMetadata.height;

  /*
   * Reduce the opacity of the entire logo.
   *
   * We modify only the alpha channel.
   * The original BREA 88 logo design remains intact.
   */
  const logoWithOpacity =
    await sharp(resizedLogoBuffer)
      .ensureAlpha()
      .joinChannel(
        await sharp(resizedLogoBuffer)
          .ensureAlpha()
          .extractChannel('alpha')
          .linear(0.38, 0)
          .toBuffer(),
        {
          raw: {
            width: actualWidth,
            height: actualHeight,
            channels: 1,
          },
        },
      )
      .png()
      .toBuffer();

  /*
   * Position the watermark in the
   * bottom-right corner.
   */
  const margin = Math.max(
    20,
    Math.round(shortestSide * 0.035),
  );

  const left = Math.max(
    0,
    width -
      actualWidth -
      margin,
  );

  const top = Math.max(
    0,
    height -
      actualHeight -
      margin,
  );

  return {
    input: logoWithOpacity,
    left,
    top,
  };
}

/**
 * Adds the BREA 88 logo watermark to
 * property images only.
 */
async function watermarkPropertyImage(
  input: Buffer,
  extension: string,
): Promise<Buffer> {
  const image = sharp(input);

  const metadata =
    await image.metadata();

  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error(
      'Unable to determine uploaded image dimensions.',
    );
  }

  const watermark =
    await createWatermark(
      width,
      height,
    );

  /*
   * Composite ONLY the real logo.
   *
   * There is deliberately NO:
   * - SVG
   * - text
   * - rectangle
   * - font
   */
  const output =
    image.composite([
      {
        input: watermark.input,
        left: watermark.left,
        top: watermark.top,
      },
    ]);

  /*
   * Keep the uploaded image format.
   */
  if (
    extension === 'jpg' ||
    extension === 'jpeg'
  ) {
    return output
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
      .toBuffer();
  }

  if (extension === 'webp') {
    return output
      .webp({
        quality: 90,
      })
      .toBuffer();
  }

  return output
    .png({
      compressionLevel: 6,
    })
    .toBuffer();
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * ----------------------------------------
     * RATE LIMIT
     * ----------------------------------------
     */
    const clientKey =
      getClientKey(
        request,
        'blob-upload',
      );

    const rateLimitResult =
      rateLimit(
        clientKey,
        20,
        60_000,
      );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Too many upload attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              rateLimitResult.retryAfterSeconds,
            ),
          },
        },
      );
    }

    /*
     * ----------------------------------------
     * ADMIN AUTHENTICATION
     * ----------------------------------------
     */
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized.',
        },
        { status: 401 },
      );
    }

    /*
     * ----------------------------------------
     * REQUEST SIZE
     * ----------------------------------------
     */
    if (
      !hasValidContentLength(
        request,
        MAX_UPLOAD_SIZE,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Upload is too large or invalid.',
        },
        { status: 413 },
      );
    }

    /*
     * ----------------------------------------
     * FORM DATA
     * ----------------------------------------
     */
    const formData =
      await request.formData();

    const file =
      formData.get('file');

    const typeValue =
      formData.get('type');

    const uploadType =
      typeof typeValue === 'string'
        ? typeValue
        : 'property';

    /*
     * ----------------------------------------
     * FILE CHECK
     * ----------------------------------------
     */
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No image file provided.',
        },
        { status: 400 },
      );
    }

    /*
     * ----------------------------------------
     * IMAGE VALIDATION
     * ----------------------------------------
     */
    const validation =
      await validateImageFile(file);

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: validation.message,
        },
        { status: 400 },
      );
    }

    const finalExtension =
      validation.extension;

    /*
     * ----------------------------------------
     * ORIGINAL BUFFER
     * ----------------------------------------
     */
    const originalBuffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    let finalBuffer: Buffer<ArrayBufferLike> =
     originalBuffer;

    /*
     * ----------------------------------------
     * WATERMARK
     *
     * Only property images receive the
     * BREA 88 watermark.
     *
     * Agent/profile/other uploads remain
     * unchanged.
     * ----------------------------------------
     */
    if (
      uploadType === 'property'
    ) {
      finalBuffer =
        await watermarkPropertyImage(
          originalBuffer,
          finalExtension,
        );
    }

    /*
     * ----------------------------------------
     * BLOB FOLDER
     * ----------------------------------------
     */
    const folder =
      uploadType === 'property'
        ? 'properties'
        : 'uploads';

    /*
     * ----------------------------------------
     * UNIQUE FILE NAME
     * ----------------------------------------
     */
    const filename =
      `${folder}/${crypto.randomUUID()}.${finalExtension}`;

    /*
     * ----------------------------------------
     * CONTENT TYPE
     * ----------------------------------------
     */
    let contentType =
      'image/jpeg';

    if (
      finalExtension === 'png'
    ) {
      contentType =
        'image/png';
    } else if (
      finalExtension === 'webp'
    ) {
      contentType =
        'image/webp';
    }

    /*
     * ----------------------------------------
     * VERCEL BLOB UPLOAD
     * ----------------------------------------
     */
    const blob =
      await put(
        filename,
        finalBuffer,
        {
          access: 'public',
          addRandomSuffix: true,
          contentType,
        },
      );

    /*
     * ----------------------------------------
     * RESPONSE
     * ----------------------------------------
     */
    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error(
      'POST /api/blob/upload error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upload image.',
      },
      { status: 500 },
    );
  }
}