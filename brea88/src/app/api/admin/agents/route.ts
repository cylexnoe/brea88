import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

const ALLOWED_ROLES = ['Agent', 'Broker'] as const;
type TeamRole = (typeof ALLOWED_ROLES)[number];

function isTeamRole(value: unknown): value is TeamRole {
  return (
    typeof value === 'string' &&
    (ALLOWED_ROLES as readonly string[]).includes(value)
  );
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const agents = await prisma.agent.findMany({
      where: { role: { in: [...ALLOWED_ROLES] } },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('Admin agents GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load agents.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid agent ID.' },
        { status: 400 }
      );
    }

    const hasActiveChange = Object.prototype.hasOwnProperty.call(
      body ?? {},
      'isActive'
    );
    const hasRoleChange = Object.prototype.hasOwnProperty.call(
      body ?? {},
      'role'
    );

    if (!hasActiveChange && !hasRoleChange) {
      return NextResponse.json(
        {
          success: false,
          message: 'No supported account changes were provided.',
        },
        { status: 400 }
      );
    }

    if (hasActiveChange && typeof body?.isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isActive must be a boolean.' },
        { status: 400 }
      );
    }

    if (hasRoleChange && !isTeamRole(body?.role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Role must be either Agent or Broker.',
        },
        { status: 400 }
      );
    }

    const existing = await prisma.agent.findUnique({
      where: { id },
      select: { id: true, fullName: true, role: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Agent or Broker not found.' },
        { status: 404 }
      );
    }

    if (!isTeamRole(existing.role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'This account is not an Agent or Broker account.',
        },
        { status: 400 }
      );
    }

    const data: { isActive?: boolean; role?: TeamRole } = {};

    if (hasActiveChange) {
      data.isActive = body.isActive;
    }

    if (hasRoleChange) {
      data.role = body.role;
    }

    const agent = await prisma.agent.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        lastSeen: true,
      },
    });

    const changes: string[] = [];

    if (hasRoleChange && existing.role !== agent.role) {
      changes.push(`role changed to ${agent.role}`);
    }

    if (hasActiveChange) {
      changes.push(
        agent.isActive
          ? 'account activated'
          : 'account deactivated'
      );
    }

    return NextResponse.json({
      success: true,
      message:
        changes.length > 0
          ? `${agent.fullName}: ${changes.join(' and ')}.`
          : 'No changes were necessary.',
      agent,
    });
  } catch (error) {
    console.error('Admin agents PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update the account.' },
      { status: 500 }
    );
  }
}
