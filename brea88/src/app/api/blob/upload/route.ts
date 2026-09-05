import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { hasValidContentLength, validateImageFile } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'blob-upload'), 20);

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many uploads. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  if (!hasValidContentLength(request, 6 * 1024 * 1024)) {
    return NextResponse.json({ success: false, message: 'Upload is too large.' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'No image file was provided.' }, { status: 400 });
    }

    const validation = await validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    }

    const filename = `properties/${crypto.randomUUID()}.${validation.extension}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url: blob.url }, { status: 200 });
  } catch (error) {
    console.error('Blob upload failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Image upload failed.' }, { status: 500 });
  }
}
