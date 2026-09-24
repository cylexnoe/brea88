import {
  handleUpload,
  type HandleUploadBody,
} from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getClientKey,
  rateLimit,
} from '@/lib/rate-limit';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const runtime = 'nodejs';

export async function POST(
  request: Request,
) {
  const limit = rateLimit(
    getClientKey(
      request,
      'property-image-token',
    ),
    40,
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

  try {
    const body =
      (await request.json()) as HandleUploadBody;

    const jsonResponse =
      await handleUpload({
        body,
        request,

        onBeforeGenerateToken:
          async (pathname) => {
            if (
              !pathname.startsWith(
                'properties/',
              )
            ) {
              throw new Error(
                'Invalid property upload path.',
              );
            }

            return {
              allowedContentTypes:
                ALLOWED_IMAGE_TYPES,

              addRandomSuffix: true,

              tokenPayload:
                JSON.stringify({
                  type: 'property-image',
                }),
            };
          },

        onUploadCompleted:
          async ({ blob }) => {
            console.log(
              '[Property Image Upload] Completed:',
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
      '[Property Image Upload] Token error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to authorize property image upload.',
      },
      {
        status: 400,
      },
    );
  }
}