import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  hasValidContentLength,
  validateImageFile,
} from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const MAX_UPLOAD_SIZE = 6 * 1024 * 1024;

/*
 * ============================================================
 * BREA 88 LOGO WATERMARK
 * ============================================================
 *
 * Watermark behavior:
 *
 * - Uses the actual BREA 88 watermark from:
 *   public/img/watermark.png
 *
 * - Centered horizontally and vertically
 * - Approximately 25% opacity
 * - Preserves the original watermark transparency
 * - No joinChannel()
 * - No extractChannel()
 * - No raw RGBA buffers
 * - No manual alpha-channel manipulation
 * - No SVG text or fonts
 *
 * The SVG is only used as a safe image container so Sharp can
 * apply opacity without constructing a raw pixel buffer.
 */

async function createWatermark(
  width: number,
  height: number,
) {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'img',
    'watermark.png',
  );

  /*
   * ==========================================================
   * CHECK WATERMARK
   * ==========================================================
   */

  try {
    await fs.access(logoPath);
  } catch {
    throw new Error(
      'BREA 88 watermark not found at public/img/watermark.png',
    );
  }

  /*
   * ==========================================================
   * READ LOGO
   * ==========================================================
   */

  const logoBuffer =
    await fs.readFile(logoPath);

  /*
   * Validate the logo before processing.
   */

  const logoMetadata =
    await sharp(logoBuffer).metadata();

  if (
    !logoMetadata.width ||
    !logoMetadata.height
  ) {
    throw new Error(
      'Unable to read BREA 88 logo dimensions.',
    );
  }

  /*
   * ==========================================================
   * WATERMARK SIZE
   * ==========================================================
   *
   * The watermark is sized relative to the uploaded image.
   *
   * Approximately 25% of the shortest side.
   *
   * Minimum: 140px
   * Maximum: 360px
   */

  const shortestSide =
    Math.min(width, height);

  const targetWidth =
    Math.max(
      140,
      Math.min(
        360,
        Math.round(
          shortestSide * 0.25,
        ),
      ),
    );

  /*
   * ==========================================================
   * RESIZE LOGO
   * ==========================================================
   *
   * Sharp keeps the original aspect ratio.
   *
   * We convert to PNG so transparency is retained reliably.
   */

  const resizedLogoBuffer =
    await sharp(logoBuffer)
      .resize({
        width: targetWidth,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .ensureAlpha()
      .png()
      .toBuffer();

  /*
   * Read the final logo dimensions.
   */

  const resizedLogoMetadata =
    await sharp(
      resizedLogoBuffer,
    ).metadata();

  const logoWidth =
    resizedLogoMetadata.width;

  const logoHeight =
    resizedLogoMetadata.height;

  if (
    !logoWidth ||
    !logoHeight
  ) {
    throw new Error(
      'Unable to determine resized BREA 88 logo dimensions.',
    );
  }

  /*
   * ==========================================================
   * APPLY OPACITY
   * ==========================================================
   *
   * We wrap the actual PNG inside an SVG <image>.
   *
   * IMPORTANT:
   *
   * There is NO SVG text here.
   *
   * The SVG is simply being used as a safe compositing layer
   * to control opacity.
   *
   * The actual BREA 88 logo remains the PNG image.
   */

  const logoBase64 =
    resizedLogoBuffer.toString(
      'base64',
    );

  const opacity = 0.25;

  const watermarkSvg =
    Buffer.from(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${logoWidth}"
        height="${logoHeight}"
        viewBox="0 0 ${logoWidth} ${logoHeight}"
      >
        <image
          href="data:image/png;base64,${logoBase64}"
          x="0"
          y="0"
          width="${logoWidth}"
          height="${logoHeight}"
          preserveAspectRatio="none"
          opacity="${opacity}"
        />
      </svg>
    `);

  /*
   * Render the SVG to a normal PNG.
   *
   * This avoids:
   *
   * - joinChannel()
   * - extractChannel()
   * - raw()
   * - manually allocated RGBA buffers
   *
   * so we avoid the previous libvips memory-size mismatch.
   */

  const watermarkBuffer =
    await sharp(watermarkSvg)
      .png()
      .toBuffer();

  /*
   * ==========================================================
   * CENTER THE WATERMARK
   * ==========================================================
   *
   * Horizontal:
   *
   *   (image width - logo width) / 2
   *
   * Vertical:
   *
   *   (image height - logo height) / 2
   */

  const left =
    Math.max(
      0,
      Math.round(
        (width - logoWidth) / 2,
      ),
    );

  const top =
    Math.max(
      0,
      Math.round(
        (height - logoHeight) / 2,
      ),
    );

  return {
    input: watermarkBuffer,
    left,
    top,
  };
}

/*
 * ============================================================
 * WATERMARK PROPERTY IMAGE
 * ============================================================
 *
 * JPG  -> JPG
 * PNG  -> PNG
 * WEBP -> WEBP
 */

async function watermarkPropertyImage(
  file: File,
  extension:
    | 'jpg'
    | 'png'
    | 'webp',
) {
  /*
   * ==========================================================
   * READ UPLOADED IMAGE
   * ==========================================================
   */

  const inputBuffer =
    Buffer.from(
      await file.arrayBuffer(),
    );

  const image =
    sharp(inputBuffer);

  /*
   * ==========================================================
   * IMAGE METADATA
   * ==========================================================
   */

  const metadata =
    await image.metadata();

  const width =
    metadata.width;

  const height =
    metadata.height;

  if (
    !width ||
    !height
  ) {
    throw new Error(
      'Unable to determine uploaded image dimensions.',
    );
  }

  /*
   * ==========================================================
   * CREATE WATERMARK
   * ==========================================================
   */

  const watermark =
    await createWatermark(
      width,
      height,
    );

  /*
   * ==========================================================
   * COMPOSITE WATERMARK
   * ==========================================================
   *
   * The logo is already a proper PNG with transparency.
   *
   * Sharp handles the compositing internally.
   *
   * No raw pixel operations are used.
   */

  const processed =
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
   * ==========================================================
   * OUTPUT FORMAT
   * ==========================================================
   */

  if (extension === 'png') {
    return {
      buffer:
        await processed
          .png({
            compressionLevel: 6,
          })
          .toBuffer(),

      contentType:
        'image/png',

      extension:
        'png' as const,
    };
  }

  if (extension === 'webp') {
    return {
      buffer:
        await processed
          .webp({
            quality: 90,
          })
          .toBuffer(),

      contentType:
        'image/webp',

      extension:
        'webp' as const,
    };
  }

  return {
    buffer:
      await processed
        .jpeg({
          quality: 90,
          mozjpeg: true,
        })
        .toBuffer(),

    contentType:
      'image/jpeg',

    extension:
      'jpg' as const,
  };
}

/*
 * ============================================================
 * POST /api/blob/upload
 * ============================================================
 */

export async function POST(
  request: Request,
) {
  /*
   * ==========================================================
   * RATE LIMIT
   * ==========================================================
   */

  const limit =
    rateLimit(
      getClientKey(
        request,
        'blob-upload',
      ),
      20,
    );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Too many uploads. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After':
            String(
              limit.retryAfterSeconds,
            ),
        },
      },
    );
  }

  /*
   * ==========================================================
   * ADMIN AUTHENTICATION
   * ==========================================================
   */

  if (
    !(await isAdminAuthenticated())
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Unauthorized.',
      },
      {
        status: 401,
      },
    );
  }

  /*
   * ==========================================================
   * REQUEST SIZE
   * ==========================================================
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
        message:
          'Upload is too large.',
      },
      {
        status: 413,
      },
    );
  }

  try {
    /*
     * ========================================================
     * READ FORM DATA
     * ========================================================
     */

    const formData =
      await request.formData();

    const file =
      formData.get('file');

    const uploadType =
      formData.get('type');

    /*
     * ========================================================
     * CHECK FILE
     * ========================================================
     */

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No image file was provided.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ========================================================
     * VALIDATE IMAGE
     * ========================================================
     */

    const validation =
      await validateImageFile(
        file,
      );

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.message,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ========================================================
     * UPLOAD TYPE
     * ========================================================
     *
     * ONLY property images receive the watermark.
     *
     * Profile images remain unchanged.
     */

    const isPropertyUpload =
      uploadType === 'property';

    /*
     * ========================================================
     * NORMALIZE EXTENSION
     * ========================================================
     */

    const uploadExtension:
      | 'jpg'
      | 'png'
      | 'webp' =
      validation.extension ===
      'png'
        ? 'png'
        : validation.extension ===
            'webp'
          ? 'webp'
          : 'jpg';

    /*
     * ========================================================
     * PROCESS IMAGE
     * ========================================================
     */

    let finalBuffer:
      Buffer<ArrayBufferLike>;

    let finalContentType:
      string;

    let finalExtension:
      | 'jpg'
      | 'png'
      | 'webp';

    if (isPropertyUpload) {
      /*
       * ======================================================
       * PROPERTY IMAGE
       * ======================================================
       *
       * Apply:
       *
       * - BREA 88 logo
       * - Center position
       * - ~25% opacity
       */

      const processed =
        await watermarkPropertyImage(
          file,
          uploadExtension,
        );

      finalBuffer =
        processed.buffer;

      finalContentType =
        processed.contentType;

      finalExtension =
        processed.extension;
    } else {
      /*
       * ======================================================
       * NON-PROPERTY IMAGE
       * ======================================================
       *
       * Keep profile images and other uploads untouched.
       */

      finalBuffer =
        Buffer.from(
          await file.arrayBuffer(),
        );

      finalContentType =
        file.type;

      finalExtension =
        uploadExtension;
    }

    /*
     * ========================================================
     * STORAGE FOLDER
     * ========================================================
     */

    const folder =
      isPropertyUpload
        ? 'properties'
        : 'uploads';

    /*
     * ========================================================
     * FILE NAME
     * ========================================================
     */

    const filename =
      `${folder}/${randomUUID()}.${finalExtension}`;

    /*
     * ========================================================
     * VERCEL BLOB
     * ========================================================
     */

    const blob =
      await put(
        filename,
        finalBuffer,
        {
          access:
            'public',

          addRandomSuffix:
            true,

          contentType:
            finalContentType,
        },
      );

    /*
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    /*
     * ========================================================
     * ERROR
     * ========================================================
     */

    console.error(
      'Blob upload failed:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Image upload failed.',
      },
      {
        status: 500,
      },
    );
  }
}