import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { createAgentSessionToken, getAgentFromSession } from '@/lib/agent-auth';

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
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;

    const [, salt, expectedHash] = parts;
    if (
      !salt ||
      !/^[a-f0-9]{32}$/i.test(salt) ||
      !/^[a-f0-9]{128}$/i.test(expectedHash)
    ) {
      return false;
    }

    try {
      const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return safeCompare(derivedHash, expectedHash);
    } catch {
      return false;
    }
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  return safeCompare(hashLegacyPassword(password), storedHash);
}

function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `New password must not exceed ${MAX_PASSWORD_LENGTH} characters.`;
  }

  if (/^\s|\s$/.test(password)) {
    return 'New password must not start or end with spaces.';
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'New password must contain at least one letter and one number.';
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'Invalid password data.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const currentPassword = typeof data.currentPassword === 'string' ? data.currentPassword : '';
    const newPassword = typeof data.newPassword === 'string' ? data.newPassword : '';
    const confirmPassword = typeof data.confirmPassword === 'string' ? data.confirmPassword : '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'All password fields are required.' },
        { status: 400 }
      );
    }

    if (!verifyPassword(currentPassword, agent.passwordHash)) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 401 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New passwords do not match.' },
        { status: 400 }
      );
    }

    const validationError = validateNewPassword(newPassword);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.agent.update({
      where: { id: agent.id },
      data: { passwordHash },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    });

    // Rotate the signed session after changing credentials.
    response.cookies.set({
      name: 'agent_session',
      value: createAgentSessionToken(agent.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Agent password change failed:', error);

    return NextResponse.json(
      { success: false, message: 'Unable to change password.' },
      { status: 500 }
    );
  }
}
