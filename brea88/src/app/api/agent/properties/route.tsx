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

    const properties = await prisma.property.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        tag: true,
        price: true,
        location: true,
        image: true,
        images: true,
        beds: true,
        baths: true,
        sqft: true,
        agentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error(
      'GET /api/agent/properties error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load assigned properties.',
      },
      { status: 500 }
    );
  }
}