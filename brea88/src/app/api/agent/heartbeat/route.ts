import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAgentId } from '@/lib/agent-auth';

export async function POST() {
  try {
    const agentId = await getCurrentAgentId();

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    const agent = await prisma.agent.update({
      where: {
        id: agentId,
      },
      data: {
        lastSeen: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        lastSeen: true,
      },
    });

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error(
      'Agent heartbeat error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update activity.',
      },
      {
        status: 500,
      }
    );
  }
}