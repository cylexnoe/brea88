import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: {
        slug,
      },
      include: {
        properties: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (
      !agent ||
      !agent.isActive ||
      !['Agent', 'Broker'].includes(agent.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Agent or Broker profile not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        role: agent.role,
        slug: agent.slug,
        phone: agent.phone,
        address: agent.address,
        profileImage: agent.profileImage,
        bio: agent.bio,
        facebook: agent.facebook,
        messenger: agent.messenger,
      },
      properties: agent.properties,
    });
  } catch (error) {
    console.error(
      'Agent profile error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load agent profile.',
      },
      { status: 500 }
    );
  }
}
