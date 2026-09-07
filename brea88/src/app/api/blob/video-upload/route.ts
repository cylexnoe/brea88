import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
];

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_VIDEO_TYPES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ type: 'property-video' }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('Property video upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error(
      'Property video client upload failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Video upload failed.',
      },
      { status: 400 },
    );
  }
}
