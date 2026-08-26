import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';

export async function PUT(request: Request) {
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

    const body = await request.json();

    const fullName = body.fullName?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const address = body.address?.trim() || null;
    const bio = body.bio?.trim() || null;
    const facebook = body.facebook?.trim() || null;
    const messenger = body.messenger?.trim() || null;
    const profileImage = body.profileImage?.trim() || null;

    if (!fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name and email are required.',
        },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.agent.findFirst({
      where: {
        email,
        NOT: {
          id: agent.id,
        },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already being used.',
        },
        { status: 409 }
      );
    }

    const updatedAgent = await prisma.agent.update({
      where: {
        id: agent.id,
      },
      data: {
        fullName,
        email,
        phone,
        address,
        bio,
        facebook,
        messenger,
        profileImage,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        slug: true,
        phone: true,
        address: true,
        profileImage: true,
        bio: true,
        facebook: true,
        messenger: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      agent: updatedAgent,
    });
  } catch (error) {
    console.error(
      'PUT /api/agent/profile/update error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update profile.',
      },
      { status: 500 }
    );
  }
}