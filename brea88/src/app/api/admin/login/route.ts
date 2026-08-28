import { NextResponse } from 'next/server';
import crypto from 'crypto';

import {
  createAdminSessionToken,
} from '@/lib/admin-auth';

/*
|--------------------------------------------------------------------------
| PASSWORD HASH
|--------------------------------------------------------------------------
*/

function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

/*
|--------------------------------------------------------------------------
| SAFE COMPARISON
|--------------------------------------------------------------------------
*/

function safeCompare(
  a: string,
  b: string
): boolean {
  const bufferA =
    Buffer.from(a);

  const bufferB =
    Buffer.from(b);

  if (
    bufferA.length !==
    bufferB.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    bufferA,
    bufferB
  );
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/login
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {
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
          message:
            'Invalid request body.',
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
          message:
            'Invalid login data.',
        },
        { status: 400 }
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    /*
    |--------------------------------------------------------------------------
    | INPUTS
    |--------------------------------------------------------------------------
    */

    const email =
      typeof data.email === 'string'
        ? data.email
            .trim()
            .toLowerCase()
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
    | ADMIN CREDENTIALS
    |--------------------------------------------------------------------------
    |
    | These values come from:
    |
    | ADMIN_EMAIL
    | ADMIN_PASSWORD_HASH
    |
    | Example:
    |
    | ADMIN_EMAIL=admin@example.com
    | ADMIN_PASSWORD_HASH=<sha256 hash>
    |
    |--------------------------------------------------------------------------
    */

    const adminEmail =
      process.env.ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    const adminPasswordHash =
      process.env.ADMIN_PASSWORD_HASH;

    /*
    |--------------------------------------------------------------------------
    | CONFIGURATION CHECK
    |--------------------------------------------------------------------------
    */

    if (
      !adminEmail ||
      !adminPasswordHash
    ) {
      console.error(
        'Admin authentication is not configured. Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH.'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Admin authentication is not configured.',
        },
        { status: 500 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL CHECK
    |--------------------------------------------------------------------------
    */

    const emailMatches =
      safeCompare(
        email,
        adminEmail
      );

    /*
    |--------------------------------------------------------------------------
    | PASSWORD CHECK
    |--------------------------------------------------------------------------
    */

    const passwordHash =
      hashPassword(password);

    const passwordMatches =
      safeCompare(
        passwordHash,
        adminPasswordHash
      );

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION CHECK
    |--------------------------------------------------------------------------
    |
    | We intentionally use the same generic error
    | for invalid email/password.
    |
    | This prevents revealing which admin credential
    | is incorrect.
    |--------------------------------------------------------------------------
    */

    if (
      !emailMatches ||
      !passwordMatches
    ) {
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
    | CREATE ADMIN SESSION
    |--------------------------------------------------------------------------
    */

    const token =
      createAdminSessionToken();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    const response =
      NextResponse.json({
        success: true,
        message:
          'Admin login successful.',
        admin: {
          email: adminEmail,
          role: 'Admin',
        },
      });

    /*
    |--------------------------------------------------------------------------
    | SECURE ADMIN COOKIE
    |--------------------------------------------------------------------------
    */

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'strict',

      // 2 hours
      maxAge:
        60 * 60 * 2,

      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      'POST /api/admin/login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process admin login.',
      },
      { status: 500 }
    );
  }
}

