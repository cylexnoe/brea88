import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { getAgentFromSession } from '@/lib/agent-auth';
import { validateImageFile, hasValidContentLength } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'agent-profile-upload'), 10);

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many uploads. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const agent = await getAgentFromSession();
  if (!agent) {
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

    const filename = `agents/${agent.id}/profile-${crypto.randomUUID()}.${validation.extension}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { profileImage: blob.url },
      select: { id: true, profileImage: true },
    });

    return NextResponse.json({ success: true, url: updatedAgent.profileImage });
  } catch (error) {
    console.error('Agent profile image upload failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Profile image upload failed.' }, { status: 500 });
  }
}
