import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  hasValidContentLength,
  validateImageFile,
} from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Creates the BREA 88 watermark using the actual logo image.
 *
 * IMPORTANT:
 * - No SVG text
 * - No server-side font rendering
 * - No generated text
 *
 * This prevents missing-font characters such as:
 * □□□□□
 */
async function createWatermark(
  width: number,
  height: number,
) {
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

  const logoMetadata = await sharp(
    logoBuffer,
  ).metadata();

  if (
    !logoMetadata.width ||
    !logoMetadata.height
  ) {
    throw new Error(
      'Unable to determine BREA 88 logo dimensions.',
    );
  }

  const shortestSide = Math.min(
    width,
    height,
  );

  /*
   * Watermark size.
   *
   * Approximately 18% of the shortest image
   * dimension, with sensible minimum/maximum
   * limits.
   *
   * This keeps the watermark visible without
   * covering too much of the property photo.
   */
  const targetLogoWidth = Math.max(
    120,
    Math.min(
      280,
      Math.round(shortestSide * 0.18),
    ),
  );

  const originalRatio =
    logoMetadata.height /
    logoMetadata.width;

  const targetLogoHeight = Math.max(
    1,
    Math.round(
      targetLogoWidth * originalRatio,
    ),
  );

  /*
   * Resize the real BREA 88 logo.
   */
  const resizedLogo = sharp(
    logoBuffer,
  )
    .resize({
      width: targetLogoWidth,
      height: targetLogoHeight,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .ensureAlpha();

  /*
   * Reduce only the opacity of the logo.
   *
   * The original logo colors remain intact.
   */
  const logoAlpha = await resizedLogo
    .clone()
    .extractChannel('alpha')
    .linear(0.30, 0)
    .toBuffer();

  const logoRgb = await resizedLogo
    .clone()
    .removeAlpha()
    .toBuffer();

  /*
   * Recombine RGB + modified alpha.
   */
  const finalLogo = await sharp(logoRgb)
    .joinChannel(logoAlpha, {
      raw: {
        width: targetLogoWidth,
        height: targetLogoHeight,
        channels: 1,
      },
    })
    .png()
    .toBuffer();

  /*
   * Bottom-right position.
   */
  const margin = Math.max(
    20,
    Math.round(shortestSide * 0.035),
  );

  const left = Math.max(
    0,
    width -
      targetLogoWidth -
      margin,
  );

  const top = Math.max(
    0,
    height -
      targetLogoHeight -
      margin,
  );

  return {
    input: finalLogo,
    left,
    top,
  };
}

/**
 * Applies the BREA 88 logo watermark
 * to property images only.
 */
async function watermarkPropertyImage(
  input: Buffer,
  extension: string,
) {
  const image = sharp(input);

  const metadata = await image.metadata();

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
   * Composite ONLY the actual logo.
   *
   * There is intentionally no generated
   * text or background rectangle here.
   */
  const output = image.composite([
    {
      input: watermark.input,
      left: watermark.left,
      top: watermark.top,
    },
  ]);

  /*
   * Preserve the uploaded image format.
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
    const clientKey = getClientKey(
      request,
      'blob-upload',
    );

    const rateLimitResult = rateLimit(
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
     *
     * validateImageFile checks:
     * - MIME type
     * - file size
     * - actual image signature
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

    /*
     * At this point TypeScript knows that
     * validation.ok === true.
     */
    const finalExtension =
      validation.extension;

    /*
     * ----------------------------------------
     * BUFFER
     * ----------------------------------------
     */
    const originalBuffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    let finalBuffer =
      originalBuffer;

    /*
     * ----------------------------------------
     * WATERMARK
     *
     * ONLY property images receive the
     * BREA 88 logo watermark.
     *
     * Profile images and other upload types
     * remain unchanged.
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
      `${folder}/${randomUUID()}.${finalExtension}`;

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
    const blob = await put(
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