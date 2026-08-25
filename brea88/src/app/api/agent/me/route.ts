import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';

export async function GET() {
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

    const profile = await prisma.agent.findUnique({
      where: {
        id: agent.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        slug: true,
        phone: true,
        profileImage: true,
        bio: true,
        facebook: true,
        messenger: true,
        isActive: true,
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Agent account not found.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: profile,
    });
  } catch (error) {
    console.error('GET /api/agent/me error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load agent profile.',
      },
      { status: 500 }
    );
  }
}