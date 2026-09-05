import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { createAgentSessionToken, getAgentFromSession } from '@/lib/agent-auth';
import { hasValidContentLength } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function hashLegacyPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHash] = parts;
    if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHash)) return false;

    try {
      const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return safeCompare(derivedHash, expectedHash);
    } catch {
      return false;
    }
  }

  return /^[a-f0-9]{64}$/i.test(storedHash) && safeCompare(hashLegacyPassword(password), storedHash);
}

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'agent-password-change'), 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many password-change attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!hasValidContentLength(request, 32 * 1024)) {
    return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });
  }

  try {
    const agent = await getAgentFromSession();
    if (!agent) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid password data.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const currentPassword = typeof data.currentPassword === 'string' ? data.currentPassword : '';
    const newPassword = typeof data.newPassword === 'string' ? data.newPassword : '';
    const confirmPassword = typeof data.confirmPassword === 'string' ? data.confirmPassword : '';

    if (!currentPassword || !newPassword || !confirmPassword || currentPassword.length > MAX_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH || confirmPassword.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: 'Invalid password data.' }, { status: 400 });
    }

    if (!verifyPassword(currentPassword, agent.passwordHash)) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 401 });
    }

    if (currentPassword === newPassword || newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'Please choose a new password and make sure both new password fields match.' }, { status: 400 });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH || /^\s|\s$/.test(newPassword) || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters and contain a letter and a number.' }, { status: 400 });
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    const response = NextResponse.json({ success: true, message: 'Password changed successfully.' });
    response.cookies.set({
      name: 'agent_session',
      value: createAgentSessionToken(agent.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      priority: 'high',
    });

    return response;
  } catch (error) {
    console.error('Agent password change failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Unable to change password.' }, { status: 500 });
  }
}
