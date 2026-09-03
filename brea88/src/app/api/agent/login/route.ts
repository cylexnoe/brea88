import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import { createAgentSessionToken } from '@/lib/agent-auth';

/*
|--------------------------------------------------------------------------
| PASSWORD VERIFICATION
|--------------------------------------------------------------------------
|
| New accounts use:
|   scrypt$<salt>$<derived-key>
|
| Existing accounts may still contain the old unsalted SHA-256 hash.
| Those accounts remain compatible and are transparently upgraded to
| scrypt after a successful login.
|--------------------------------------------------------------------------
*/

function hashLegacyPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');

  return `scrypt$${salt}$${derivedKey}`;
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

function verifyPassword(password: string, storedHash: string): {
  matches: boolean;
  needsUpgrade: boolean;
} {
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');

    if (parts.length !== 3) {
      return { matches: false, needsUpgrade: false };
    }

    const [, salt, expectedHash] = parts;

    if (!salt || !/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHash)) {
      return { matches: false, needsUpgrade: false };
    }

    try {
      const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');

      return {
        matches: safeCompare(derivedHash, expectedHash),
        needsUpgrade: false,
      };
    } catch {
      return { matches: false, needsUpgrade: false };
    }
  }

  // Legacy SHA-256 compatibility. Successful verification triggers an upgrade.
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return { matches: false, needsUpgrade: false };
  }

  return {
    matches: safeCompare(hashLegacyPassword(password), storedHash),
    needsUpgrade: true,
  };
}

/*
|--------------------------------------------------------------------------
| POST /api/agent/login
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
  try {
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
        { success: false, message: 'Invalid login data.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const password = typeof data.password === 'string' ? data.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        slug: true,
        isActive: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (agent.role !== 'Agent' && agent.role !== 'Broker') {
      console.warn(
        `Blocked agent portal login for account ${agent.id}: invalid role ${agent.role}`
      );

      return NextResponse.json(
        {
          success: false,
          message: 'This account is not authorized to use the agent portal.',
        },
        { status: 403 }
      );
    }

    const passwordVerification = verifyPassword(password, agent.passwordHash);

    if (!passwordVerification.matches) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Upgrade old SHA-256 credentials after successful authentication.
    if (passwordVerification.needsUpgrade) {
      try {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { passwordHash: hashPassword(password) },
        });
      } catch (upgradeError) {
        // Do not block a valid login if the credential upgrade fails.
        console.error('Agent password upgrade failed:', upgradeError);
      }
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastSeen: new Date() },
    });

    const token = createAgentSessionToken(agent.id);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      agent: {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        role: agent.role,
        slug: agent.slug,
      },
    });

    response.cookies.set({
      name: 'agent_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('========== AGENT LOGIN ERROR ==========');
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    console.error('========================================');

    return NextResponse.json(
      { success: false, message: 'Unable to process login.' },
      { status: 500 }
    );
  }
}
