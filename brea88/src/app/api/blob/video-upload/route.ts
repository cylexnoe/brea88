import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
];

export const runtime = 'nodejs';

export async function POST(request: Request) {
  /*
   * ============================================================
   * RATE LIMIT
   * ============================================================
   */

  const limit = rateLimit(
    getClientKey(request, 'property-video-token'),
    20,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Too many upload requests. Please try again later.',
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

  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
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
   * HANDLE VERCEL BLOB CLIENT UPLOAD
   * ============================================================
   *
   * IMPORTANT:
   *
   * This endpoint does NOT receive the video itself.
   *
   * It only handles the authorization/token handshake.
   *
   * The actual video goes directly from the browser
   * to Vercel Blob.
   */

  try {
    const body =
      (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (
        pathname,
      ) => {
        console.log(
          '[Video Upload] Generating upload token:',
          pathname,
        );

        return {
          allowedContentTypes:
            ALLOWED_VIDEO_TYPES,

          addRandomSuffix: true,

          tokenPayload: JSON.stringify({
            type: 'property-video',
          }),
        };
      },

      onUploadCompleted: async ({
        blob,
      }) => {
        console.log(
          '[Video Upload] Upload completed:',
          blob.url,
        );
      },
    });

    return NextResponse.json(
      jsonResponse,
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      '[Video Upload] Token generation failed:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to authorize video upload.',
      },
      {
        status: 400,
      },
    );
  }
}