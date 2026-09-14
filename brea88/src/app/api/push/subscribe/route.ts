import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';

interface PushSubscriptionPayload {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    /*
     * IMPORTANT:
     * We identify the Agent/Broker from the existing
     * signed HttpOnly `agent_session` cookie.
     *
     * We do NOT trust an agentId sent by the browser.
     */
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You must be logged in as an active Agent or Broker.',
        },
        { status: 401 },
      );
    }

    const body =
      (await request.json()) as PushSubscriptionPayload;

    const endpoint =
      typeof body.endpoint === 'string'
        ? body.endpoint.trim()
        : '';

    const p256dh =
      typeof body.keys?.p256dh === 'string'
        ? body.keys.p256dh.trim()
        : '';

    const auth =
      typeof body.keys?.auth === 'string'
        ? body.keys.auth.trim()
        : '';

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid push subscription data.',
        },
        { status: 400 },
      );
    }

    /*
     * The endpoint is unique.
     *
     * If this Agent already subscribed from this browser/device,
     * update the existing subscription instead of creating a duplicate.
     */
    const subscription =
      await prisma.pushSubscription.upsert({
        where: {
          endpoint,
        },

        update: {
          agentId: agent.id,
          p256dh,
          auth,
          updatedAt: new Date(),
        },

        create: {
          agentId: agent.id,
          endpoint,
          p256dh,
          auth,
        },
      });

    return NextResponse.json({
      success: true,

      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
      },

      agent: {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        role: agent.role,
      },
    });
  } catch (error) {
    console.error(
      'POST /api/push/subscribe error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save push subscription.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized.',
        },
        { status: 401 },
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const endpoint =
      body &&
      typeof body === 'object' &&
      'endpoint' in body &&
      typeof body.endpoint === 'string'
        ? body.endpoint.trim()
        : '';

    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Push subscription endpoint is required.',
        },
        { status: 400 },
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        agentId: agent.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'DELETE /api/push/subscribe error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove push subscription.',
      },
      { status: 500 },
    );
  }
}