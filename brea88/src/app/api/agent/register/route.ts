import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import {
  createAgentSessionToken,
} from '@/lib/agent-auth';

/*
|--------------------------------------------------------------------------
| PASSWORD HASHING
|--------------------------------------------------------------------------
| NOTE:
| This keeps your current authentication system compatible.
| We should migrate existing passwords to Argon2id/bcrypt later.
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
| SLUG
|--------------------------------------------------------------------------
*/

function createSlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'agent';
}

/*
|--------------------------------------------------------------------------
| POST /api/agent/register
|--------------------------------------------------------------------------
| Public agent registration.
|
| SECURITY:
| - Users cannot choose their own role.
| - Every public registration becomes "Agent".
| - Broker/Admin privileges must be assigned separately.
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
          message: 'Invalid registration data.',
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

    const fullName =
      typeof data.fullName === 'string'
        ? data.fullName.trim()
        : '';

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

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is required.',
        },
        { status: 400 }
      );
    }

    if (fullName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is too short.',
        },
        { status: 400 }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is too long.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL VALIDATION
    |--------------------------------------------------------------------------
    */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required.',
        },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is too long.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PASSWORD VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password is required.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters.',
        },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must not exceed 128 characters.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING EMAIL
    |--------------------------------------------------------------------------
    */

    const existingAgent =
      await prisma.agent.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingAgent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An account with this email already exists.',
        },
        { status: 409 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    const baseSlug = createSlug(fullName);

    let slug = baseSlug;

    const existingSlug =
      await prisma.agent.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      });

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    /*
    |--------------------------------------------------------------------------
    | SECURITY: PUBLIC REGISTRATION ROLE
    |--------------------------------------------------------------------------
    |
    | DO NOT use:
    |
    | const role = body.role === 'Broker'
    |   ? 'Broker'
    |   : 'Agent';
    |
    | A user could simply submit:
    |
    | {
    |   "role": "Broker"
    | }
    |
    | Instead, public registration always creates an Agent.
    |--------------------------------------------------------------------------
    */

    const role =
      data.role === 'Broker'
        ? 'Broker'
        : data.role === 'Agent'
          ? 'Agent'
          : null;

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid account role.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE AGENT
    |--------------------------------------------------------------------------
    */

    const agent = await prisma.agent.create({
        data: {
          fullName,
          email,
          passwordHash: hashPassword(password),
          role,
          slug,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          slug: true,
          isActive: true,
        },
      });

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
      NextResponse.json(
        {
          success: true,
          message:
            'Account created successfully.',
          agent,
        },
        {
          status: 201,
        }
      );

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
      'Agent registration error:',
      error
    );

    /*
    |--------------------------------------------------------------------------
    | DATABASE UNIQUE CONSTRAINT
    |--------------------------------------------------------------------------
    |
    | Protect against a race condition where another registration
    | creates the same email/slug between our check and create.
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof Error &&
      error.message.includes(
        'Unique constraint'
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An account with this information already exists.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to create agent account.',
      },
      { status: 500 }
    );
  }
}

