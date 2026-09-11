import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  hasValidContentLength,
  validateImageFile,
} from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const MAX_UPLOAD_SIZE = 6 * 1024 * 1024;

/*
 * Creates the BREA 88 REALTY watermark.
 *
 * The watermark is generated dynamically based on the
 * uploaded image dimensions, so it looks appropriate on
 * both portrait and landscape property photos.
 */
function createWatermarkSvg(
  width: number,
  height: number,
) {
  /*
   * Scale the watermark according to the image size.
   *
   * Example:
   * 1920px image -> larger watermark
   * 800px image  -> smaller watermark
   */
  const scale = Math.max(
    0.75,
    Math.min(width, height) / 900,
  );

  const padding = Math.round(28 * scale);

  const titleSize = Math.max(
    18,
    Math.round(30 * scale),
  );

  const subtitleSize = Math.max(
    10,
    Math.round(15 * scale),
  );

  const boxWidth = Math.max(
    220,
    Math.round(300 * scale),
  );

  const boxHeight = Math.max(
    62,
    Math.round(78 * scale),
  );

  const x = Math.max(
    padding,
    width - boxWidth - padding,
  );

  const y = Math.max(
    padding,
    height - boxHeight - padding,
  );

  const radius = Math.max(
    10,
    Math.round(16 * scale),
  );

  const strokeWidth = Math.max(
    1,
    Math.round(scale),
  );

  const titleLetterSpacing = Math.max(
    1,
    Math.round(1.5 * scale),
  );

  const subtitleLetterSpacing = Math.max(
    0.5,
    Math.round(0.8 * scale),
  );

  /*
   * Escape XML characters.
   */
  const escapeXml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(
    'BREA 88 REALTY',
  );

  const subtitle = escapeXml(
    'Service with a Heart',
  );

  return Buffer.from(`
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>

        <linearGradient
          id="brea88Watermark"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="#071936"
            stop-opacity="0.88"
          />

          <stop
            offset="100%"
            stop-color="#10294e"
            stop-opacity="0.76"
          />
        </linearGradient>

        <filter
          id="watermarkShadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="7"
            flood-color="#000000"
            flood-opacity="0.35"
          />
        </filter>

      </defs>

      <g filter="url(#watermarkShadow)">

        <!-- Watermark background -->

        <rect
          x="${x}"
          y="${y}"
          width="${boxWidth}"
          height="${boxHeight}"
          rx="${radius}"
          fill="url(#brea88Watermark)"
          stroke="#ead9b8"
          stroke-opacity="0.7"
          stroke-width="${strokeWidth}"
        />

        <!-- Gold accent -->

        <line
          x1="${x + Math.round(18 * scale)}"
          y1="${y + Math.round(17 * scale)}"
          x2="${x + Math.round(62 * scale)}"
          y2="${y + Math.round(17 * scale)}"
          stroke="#d6b77a"
          stroke-width="${Math.max(
            2,
            Math.round(2.5 * scale),
          )}"
          stroke-linecap="round"
        />

        <!-- Company name -->

        <text
          x="${x + Math.round(18 * scale)}"
          y="${y + Math.round(48 * scale)}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${titleSize}px"
          font-weight="800"
          letter-spacing="${titleLetterSpacing}px"
          fill="#ffffff"
        >
          ${title}
        </text>

        <!-- Tagline -->

        <text
          x="${x + Math.round(18 * scale)}"
          y="${y + Math.round(68 * scale)}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${subtitleSize}px"
          font-weight="500"
          letter-spacing="${subtitleLetterSpacing}px"
          fill="#ead9b8"
        >
          ${subtitle}
        </text>

      </g>

    </svg>
  `);
}

/*
 * Adds the BREA 88 watermark directly into the image.
 *
 * JPG  -> JPG
 * PNG  -> PNG
 * WEBP -> WEBP
 */

async function watermarkPropertyImage(
  file: File,
  extension: 'jpg' | 'png' | 'webp',
) {
  const inputBuffer = Buffer.from(
    await file.arrayBuffer(),
  );

  const image = sharp(inputBuffer);

  const metadata = await image.metadata();

  const width = metadata.width || 1600;
  const height = metadata.height || 1000;

  const watermark = createWatermarkSvg(
    width,
    height,
  );

  let processed = image.composite([
    {
      input: watermark,
      top: 0,
      left: 0,
    },
  ]);

  if (extension === 'png') {
    processed = processed.png();

    return {
      buffer: await processed.toBuffer(),
      contentType: 'image/png',
      extension: 'png' as const,
    };
  }

  if (extension === 'webp') {
    processed = processed.webp();

    return {
      buffer: await processed.toBuffer(),
      contentType: 'image/webp',
      extension: 'webp' as const,
    };
  }

  processed = processed.jpeg({
    quality: 90,
    mozjpeg: true,
  });

  return {
    buffer: await processed.toBuffer(),
    contentType: 'image/jpeg',
    extension: 'jpg' as const,
  };
}

export async function POST(
  request: Request,
) {
  /*
   * ============================================================
   * RATE LIMIT
   * ============================================================
   */

  const limit = rateLimit(
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
          'Retry-After': String(
            limit.retryAfterSeconds,
          ),
        },
      },
    );
  }

  /*
   * ============================================================
   * ADMIN AUTHENTICATION
   * ============================================================
   */

  if (
    !(await isAdminAuthenticated())
  ) {
    return NextResponse.json(
      {
        success: false,
        message: 'Unauthorized.',
      },
      {
        status: 401,
      },
    );
  }

  /*
   * ============================================================
   * REQUEST SIZE
   * ============================================================
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
     * ==========================================================
     * READ FORM DATA
     * ==========================================================
     */

    const formData =
      await request.formData();

    const file =
      formData.get('file');

    const uploadType =
      formData.get('type');

    if (!(file instanceof File)) {
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
     * ==========================================================
     * VALIDATE IMAGE
     * ==========================================================
     */

    const validation =
      await validateImageFile(file);

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
     * ==========================================================
     * PROPERTY UPLOAD
     * ==========================================================
     *
     * Only property uploads receive the watermark.
     *
     * Profile images remain untouched.
     */

    const isPropertyUpload =
        uploadType === 'property';

      let finalBuffer: Buffer;
      let finalContentType: string;
      let finalExtension: 'jpg' | 'png' | 'webp';

      const uploadExtension: 'jpg' | 'png' | 'webp' =
        validation.extension === 'png'
          ? 'png'
          : validation.extension === 'webp'
            ? 'webp'
            : 'jpg';

      if (isPropertyUpload) {
        /*
        * Property images are permanently watermarked
        * before being uploaded to Vercel Blob.
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
        * Non-property uploads remain unchanged.
        */
        finalBuffer = Buffer.from(
          await file.arrayBuffer(),
        );

        finalContentType =
          file.type;

        finalExtension =
          uploadExtension;
      }

    /*
     * ==========================================================
     * STORAGE FOLDER
     * ==========================================================
     */

    const folder =
      isPropertyUpload
        ? 'properties'
        : 'uploads';

    const filename =
      `${folder}/${crypto.randomUUID()}.${finalExtension}`;

    /*
     * ==========================================================
     * UPLOAD FINAL IMAGE TO VERCEL BLOB
     * ==========================================================
     *
     * The important part:
     *
     * finalBuffer is uploaded instead of the original File.
     *
     * Therefore the stored property image already contains
     * the BREA 88 watermark.
     */

    const blob = await put(
      filename,
      finalBuffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType:
          finalContentType,
      },
    );

    /*
     * ==========================================================
     * RESPONSE
     * ==========================================================
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
    console.error(
      'Blob upload failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Image upload failed.',
      },
      {
        status: 500,
      },
    );
  }
}



