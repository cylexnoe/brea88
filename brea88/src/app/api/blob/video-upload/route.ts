import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
]);

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/ogg': 'ogg',
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, 'property-video-upload'),
    10,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Too many video uploads. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
        },
      },
    );
  }

  if (!(await isAdminAuthenticated())) {
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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: 'No video file was provided.',
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'The selected video is empty.',
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Video is too large. Maximum video size is 500 MB.',
        },
        {
          status: 413,
        },
      );
    }

    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unsupported video format. Please upload MP4, WebM, MOV, or OGG.',
        },
        {
          status: 400,
        },
      );
    }

    const extension = VIDEO_EXTENSIONS[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to determine the video file extension.',
        },
        {
          status: 400,
        },
      );
    }

    const videoBuffer = Buffer.from(
      await file.arrayBuffer(),
    );

    const filename =
      `properties/videos/${randomUUID()}.${extension}`;

    const blob = await put(
      filename,
      videoBuffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
      },
    );

    console.log(
      '[Video Upload] Successfully uploaded:',
      blob.url,
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error(
      '[Video Upload] Failed:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Video upload failed.',
      },
      {
        status: 500,
      },
    );
  }
}