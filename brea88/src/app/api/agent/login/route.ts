import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import { createAgentSessionToken } from '@/lib/agent-auth';
import { hasValidContentLength } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

function hashLegacyPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyPassword(password: string, storedHash: string): { matches: boolean; needsUpgrade: boolean } {
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return { matches: false, needsUpgrade: false };

    const [, salt, expectedHash] = parts;
    if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHash)) {
      return { matches: false, needsUpgrade: false };
    }

    try {
      const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return { matches: safeCompare(derivedHash, expectedHash), needsUpgrade: false };
    } catch {
      return { matches: false, needsUpgrade: false };
    }
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) return { matches: false, needsUpgrade: false };
  return { matches: safeCompare(hashLegacyPassword(password), storedHash), needsUpgrade: true };
}

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'agent-login'), 10);

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!hasValidContentLength(request, 16 * 1024)) {
    return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid login data.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const password = typeof data.password === 'string' ? data.password : '';

    if (!email || !password || email.length > 254 || password.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true, passwordHash: true, role: true, slug: true, isActive: true },
    });

    if (!agent || !agent.isActive || !['Agent', 'Broker'].includes(agent.role)) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const passwordVerification = verifyPassword(password, agent.passwordHash);
    if (!passwordVerification.matches) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    if (passwordVerification.needsUpgrade) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { passwordHash: hashPassword(password) },
      }).catch((error) => console.error('Agent password upgrade failed:', error instanceof Error ? error.message : 'Unknown error'));
    }

    await prisma.agent.update({ where: { id: agent.id }, data: { lastSeen: new Date() } });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      agent: { id: agent.id, fullName: agent.fullName, email: agent.email, role: agent.role, slug: agent.slug },
    });

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
    console.error('Agent login failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Unable to process login.' }, { status: 500 });
  }
}
