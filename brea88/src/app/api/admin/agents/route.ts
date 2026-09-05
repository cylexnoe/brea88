import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { hasValidContentLength } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const ALLOWED_ROLES = ['Agent', 'Broker'] as const;
type TeamRole = (typeof ALLOWED_ROLES)[number];

function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === 'string' && (ALLOWED_ROLES as readonly string[]).includes(value);
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function createSlug(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'agent';
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

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
        _count: { select: { properties: true, inquiries: true } },
      },
    });

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('Admin agents GET failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Unable to load agents.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'admin-create-account'), 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many account-creation attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: 'Only administrators can create Agent or Broker accounts.' }, { status: 403 });
  }

  if (!hasValidContentLength(request, 32 * 1024)) {
    return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid account data.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const role = data.role;

    if (fullName.length < 2 || fullName.length > 100) return NextResponse.json({ success: false, message: 'Please provide a valid full name.' }, { status: 400 });
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    if (!phone || phone.length > 30) return NextResponse.json({ success: false, message: 'Please provide a valid phone number.' }, { status: 400 });
    if (!isTeamRole(role)) return NextResponse.json({ success: false, message: 'Role must be either Agent or Broker.' }, { status: 400 });
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return NextResponse.json({ success: false, message: 'Password must be 8 to 128 characters and contain a letter and a number.' }, { status: 400 });

    const existingAgent = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
    if (existingAgent) return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });

    const baseSlug = createSlug(fullName);
    let slug = baseSlug;
    const existingSlug = await prisma.agent.findUnique({ where: { slug }, select: { id: true } });
    if (existingSlug) slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const agent = await prisma.agent.create({
      data: { fullName, email, phone, passwordHash: hashPassword(password), role, slug },
      select: { id: true, fullName: true, email: true, phone: true, role: true, slug: true, isActive: true },
    });

    return NextResponse.json({ success: true, message: `${role} account created successfully.`, agent }, { status: 201 });
  } catch (error) {
    console.error('Admin agents POST failed:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.message.includes('Unique constraint')) return NextResponse.json({ success: false, message: 'An account with this information already exists.' }, { status: 409 });
    return NextResponse.json({ success: false, message: 'Unable to create the account.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid account data.' }, { status: 400 });

    const data = body as Record<string, unknown>;
    const id = Number(data.id);
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ success: false, message: 'Invalid agent ID.' }, { status: 400 });

    const hasActiveChange = Object.prototype.hasOwnProperty.call(data, 'isActive');
    const hasRoleChange = Object.prototype.hasOwnProperty.call(data, 'role');
    if (!hasActiveChange && !hasRoleChange) return NextResponse.json({ success: false, message: 'No supported account changes were provided.' }, { status: 400 });
    if (hasActiveChange && typeof data.isActive !== 'boolean') return NextResponse.json({ success: false, message: 'isActive must be a boolean.' }, { status: 400 });
    if (hasRoleChange && !isTeamRole(data.role)) return NextResponse.json({ success: false, message: 'Role must be either Agent or Broker.' }, { status: 400 });

    const existing = await prisma.agent.findUnique({ where: { id }, select: { id: true, fullName: true, role: true } });
    if (!existing || !isTeamRole(existing.role)) return NextResponse.json({ success: false, message: 'Agent or Broker not found.' }, { status: 404 });

    const updateData: { isActive?: boolean; role?: TeamRole } = {};
    if (hasActiveChange) updateData.isActive = data.isActive as boolean;
    if (hasRoleChange) updateData.role = data.role as TeamRole;

    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
      select: { id: true, fullName: true, email: true, role: true, isActive: true, lastSeen: true },
    });

    const changes: string[] = [];
    if (hasRoleChange && existing.role !== agent.role) changes.push(`role changed to ${agent.role}`);
    if (hasActiveChange) changes.push(agent.isActive ? 'account activated' : 'account deactivated');

    return NextResponse.json({ success: true, message: changes.length ? `${agent.fullName}: ${changes.join(' and ')}.` : 'No changes were necessary.', agent });
  } catch (error) {
    console.error('Admin agents PATCH failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Unable to update the account.' }, { status: 500 });
  }
}
