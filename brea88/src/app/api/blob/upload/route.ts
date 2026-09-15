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
 * Creates the BREA 88 watermark using the actual
 * public/img/LOGO.png image.
 *
 * No SVG text.
 * No fonts.
 * No server-side text rendering.
 *
 * This prevents the □□□□ problem.
 */
async function createWatermark(
  width: number,
  height: number,
): Promise<{
  input: Buffer<ArrayBufferLike>;
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
   * ----------------------------------------
   * CHECK LOGO
   * ----------------------------------------
   */
  try {
    await fs.access(logoPath);
  } catch {
    throw new Error(
      'BREA 88 watermark logo was not found at public/img/LOGO.png',
    );
  }

  /*
   * ----------------------------------------
   * READ LOGO
   * ----------------------------------------
   */
  const logoBuffer =
    await fs.readFile(logoPath);

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
   * ----------------------------------------
   * CALCULATE WATERMARK SIZE
   * ----------------------------------------
   */
  const shortestSide =
    Math.min(width, height);

  const desiredWidth =
    Math.round(shortestSide * 0.20);

  const logoWidth =
    Math.max(
      140,
      Math.min(
        320,
        desiredWidth,
      ),
    );

  /*
   * ----------------------------------------
   * RESIZE LOGO
   *
   * Sharp determines the correct height
   * automatically while preserving the
   * original logo aspect ratio.
   * ----------------------------------------
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
   * ----------------------------------------
   * GET ACTUAL OUTPUT DIMENSIONS
   * ----------------------------------------
   */
  const resizedMetadata =
    await sharp(
      resizedLogoBuffer,
    ).metadata();

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
   * ----------------------------------------
   * CREATE SUBTLE LOGO OPACITY
   * ----------------------------------------
   *
   * IMPORTANT:
   *
   * We first REMOVE the existing alpha
   * channel and then JOIN our modified
   * alpha channel.
   *
   * This prevents Sharp from creating an
   * invalid 5-channel image.
   * ----------------------------------------
   */

  const logoRgb =
    await sharp(
      resizedLogoBuffer,
    )
      .removeAlpha()
      .png()
      .toBuffer();

  const originalAlpha =
    await sharp(
      resizedLogoBuffer,
    )
      .ensureAlpha()
      .extractChannel('alpha')
      .linear(0.38, 0)
      .toBuffer();

  /*
   * Combine RGB + ONE alpha channel.
   */
  const finalLogo =
    await sharp(logoRgb)
      .joinChannel(
        originalAlpha,
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
   * ----------------------------------------
   * POSITION WATERMARK
   * ----------------------------------------
   */
  const margin =
    Math.max(
      20,
      Math.round(
        shortestSide * 0.035,
      ),
    );

  const left =
    Math.max(
      0,
      width -
        actualWidth -
        margin,
    );

  const top =
    Math.max(
      0,
      height -
        actualHeight -
        margin,
    );

  return {
    input: finalLogo,
    left,
    top,
  };
}

/**
 * Adds the BREA 88 logo watermark to
 * property images only.
 */
async function watermarkPropertyImage(
  input: Buffer<ArrayBufferLike>,
  extension: string,
): Promise<Buffer<ArrayBufferLike>> {
  const image =
    sharp(input);

  const metadata =
    await image.metadata();

  const width =
    metadata.width;

  const height =
    metadata.height;

  if (!width || !height) {
    throw new Error(
      'Unable to determine uploaded image dimensions.',
    );
  }

  /*
   * Create watermark.
   */
  const watermark =
    await createWatermark(
      width,
      height,
    );

  /*
   * ----------------------------------------
   * COMPOSITE LOGO
   * ----------------------------------------
   *
   * There is intentionally NO:
   *
   * - SVG
   * - text
   * - font
   * - generated characters
   * - rectangle
   *
   * Only the real BREA 88 logo is added.
   */
  const output =
    image.composite([
      {
        input:
          watermark.input,
        left:
          watermark.left,
        top:
          watermark.top,
      },
    ]);

  /*
   * ----------------------------------------
   * OUTPUT FORMAT
   * ----------------------------------------
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

  if (
    extension === 'webp'
  ) {
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
     * ========================================
     * RATE LIMIT
     * ========================================
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

    if (
      !rateLimitResult.allowed
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Too many upload attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After':
              String(
                rateLimitResult.retryAfterSeconds,
              ),
          },
        },
      );
    }

    /*
     * ========================================
     * ADMIN AUTHENTICATION
     * ========================================
     */
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unauthorized.',
        },
        {
          status: 401,
        },
      );
    }

    /*
     * ========================================
     * REQUEST SIZE
     * ========================================
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
        {
          status: 413,
        },
      );
    }

    /*
     * ========================================
     * FORM DATA
     * ========================================
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
     * ========================================
     * FILE CHECK
     * ========================================
     */
    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No image file provided.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ========================================
     * IMAGE VALIDATION
     * ========================================
     */
    const validation =
      await validateImageFile(
        file,
      );

    if (
      !validation.ok
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            validation.message,
        },
        {
          status: 400,
        },
      );
    }

    const finalExtension =
      validation.extension;

    /*
     * ========================================
     * ORIGINAL BUFFER
     * ========================================
     */
    const originalBuffer:
      Buffer<ArrayBufferLike> =
      Buffer.from(
        await file.arrayBuffer(),
      );

    let finalBuffer:
      Buffer<ArrayBufferLike> =
      originalBuffer;

    /*
     * ========================================
     * WATERMARK PROPERTY IMAGES
     * ========================================
     *
     * Property images:
     *     watermark = YES
     *
     * Profile images:
     *     watermark = NO
     *
     * Other uploads:
     *     watermark = NO
     * ========================================
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
     * ========================================
     * BLOB FOLDER
     * ========================================
     */
    const folder =
      uploadType === 'property'
        ? 'properties'
        : 'uploads';

    /*
     * ========================================
     * UNIQUE FILE NAME
     * ========================================
     */
    const filename =
      `${folder}/${crypto.randomUUID()}.${finalExtension}`;

    /*
     * ========================================
     * CONTENT TYPE
     * ========================================
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
     * ========================================
     * VERCEL BLOB UPLOAD
     * ========================================
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
     * ========================================
     * SUCCESS
     * ========================================
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
      {
        status: 500,
      },
    );
  }
}