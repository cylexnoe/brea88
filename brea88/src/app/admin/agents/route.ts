import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

/*
|--------------------------------------------------------------------------
| GET /api/admin/agents
|--------------------------------------------------------------------------
| Returns all agents for the authenticated administrator.
*/

export async function GET() {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const agents =
      await prisma.agent.findMany({
        orderBy: {
          createdAt: 'desc',
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
          lastSeen: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              properties: true,
              inquiries: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error(
      'Admin agents GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load agents.',
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/admin/agents
|--------------------------------------------------------------------------
| Activate or deactivate an agent.
|
| Body:
| {
|   "id": 1,
|   "isActive": false
| }
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: Request
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    const id =
      Number(body?.id);

    const isActive =
      body?.isActive;

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid agent ID.',
        },
        { status: 400 }
      );
    }

    if (
      typeof isActive !== 'boolean'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'isActive must be a boolean.',
        },
        { status: 400 }
      );
    }

    const agent =
      await prisma.agent.update({
        where: {
          id,
        },

        data: {
          isActive,
        },

        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          lastSeen: true,
        },
      });

    return NextResponse.json({
      success: true,

      message: isActive
        ? 'Agent activated successfully.'
        : 'Agent deactivated successfully.',

      agent,
    });
  } catch (error) {
    console.error(
      'Admin agents PATCH error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to update agent status.',
      },
      { status: 500 }
    );
  }
}