import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import {createAgentSessionToken,} from '@/lib/agent-auth';

/*
|--------------------------------------------------------------------------
| PASSWORD HASH
|--------------------------------------------------------------------------
| Kept compatible with your existing accounts.
|--------------------------------------------------------------------------
*/

function hashPassword(password: string) {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

/*
|--------------------------------------------------------------------------
| POST /api/agent/login
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
  try {
    /*
    |--------------------------------------------------------------------------
    | PARSE REQUEST
    |--------------------------------------------------------------------------
    */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid login data.',
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    /*
    |--------------------------------------------------------------------------
    | INPUTS
    |--------------------------------------------------------------------------
    */

    const email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : '';

    const password =
      typeof data.password === 'string'
        ? data.password
        : '';

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email and password are required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND ACCOUNT
    |--------------------------------------------------------------------------
    */

    const agent =
      await prisma.agent.findUnique({
        where: {
          email,
        },
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

    /*
    |--------------------------------------------------------------------------
    | GENERIC AUTHENTICATION ERROR
    |--------------------------------------------------------------------------
    |
    | Do not tell the user whether:
    |
    | - the email exists
    | - the password is wrong
    | - the account is inactive
    |
    | This prevents account enumeration.
    |--------------------------------------------------------------------------
    */

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS
    |--------------------------------------------------------------------------
    */

    if (!agent.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE VALIDATION
    |--------------------------------------------------------------------------
    |
    | Only Agent and Broker accounts are allowed
    | through the agent portal.
    |--------------------------------------------------------------------------
    */

    if (
      agent.role !== 'Agent' &&
      agent.role !== 'Broker'
    ) {
      console.warn(
        `Blocked invalid agent role for account ${agent.id}: ${agent.role}`
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'This account is not authorized to use the agent portal.',
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PASSWORD CHECK
    |--------------------------------------------------------------------------
    */

    const passwordHash =
      hashPassword(password);

    const passwordMatches =
      crypto.timingSafeEqual(
        Buffer.from(passwordHash),
        Buffer.from(agent.passwordHash)
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE SESSION
    |--------------------------------------------------------------------------
    */

    const token =
      createAgentSessionToken(
        agent.id
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    const response =
      NextResponse.json({
        success: true,
        message:
          'Login successful.',
        agent: {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          role: agent.role,
          slug: agent.slug,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | SECURE SESSION COOKIE
    |--------------------------------------------------------------------------
    */

    response.cookies.set({
      name: 'agent_session',
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      maxAge:
        60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      'POST /api/agent/login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process login.',
      },
      { status: 500 }
    );
  }
}

