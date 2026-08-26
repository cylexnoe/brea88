import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: 'No image file was provided.',
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only JPG, PNG, and WebP images are allowed.',
        },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image must be 5MB or smaller.',
        },
        { status: 400 }
      );
    }

    const extension =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
        ? 'webp'
        : 'jpg';

    const filename = `agents/${agent.id}/profile-${crypto.randomUUID()}.${extension}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    const updatedAgent = await prisma.agent.update({
      where: {
        id: agent.id,
      },
      data: {
        profileImage: blob.url,
      },
      select: {
        id: true,
        profileImage: true,
      },
    });

    return NextResponse.json({
      success: true,
      url: updatedAgent.profileImage,
    });
  } catch (error) {
    console.error('Agent profile image upload error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Profile image upload failed.',
      },
      { status: 500 }
    );
  }
}