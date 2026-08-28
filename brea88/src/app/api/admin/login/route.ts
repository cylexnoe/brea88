import { NextResponse } from 'next/server';
import crypto from 'crypto';

import {
  createAdminSessionToken,
} from '@/lib/admin-auth';

/*
|--------------------------------------------------------------------------
| SAFE COMPARISON
|--------------------------------------------------------------------------
*/

function safeCompare(
  a: string,
  b: string
): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
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

    const data =
      body as Record<string, unknown>;

    /*
    |--------------------------------------------------------------------------
    | INPUTS
    |--------------------------------------------------------------------------
    */

    const username =
      typeof data.username === 'string'
        ? data.username.trim()
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

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Username and password are required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ENVIRONMENT VARIABLES
    |--------------------------------------------------------------------------
    |
    | Your existing credentials are:
    |
    | ADMIN_USERNAME
    | ADMIN_PASSWORD
    |
    |--------------------------------------------------------------------------
    */

    const adminUsername =
      process.env.ADMIN_USERNAME?.trim();

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    /*
    |--------------------------------------------------------------------------
    | CONFIGURATION CHECK
    |--------------------------------------------------------------------------
    */

    if (
      !adminUsername ||
      !adminPassword
    ) {
      console.error(
        'Admin authentication is not configured. Missing ADMIN_USERNAME or ADMIN_PASSWORD.'
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
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const usernameMatches =
      safeCompare(
        username,
        adminUsername
      );

    const passwordMatches =
      safeCompare(
        password,
        adminPassword
      );

    /*
    |--------------------------------------------------------------------------
    | INVALID CREDENTIALS
    |--------------------------------------------------------------------------
    */

    if (
      !usernameMatches ||
      !passwordMatches
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid username or password.',
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
          username: adminUsername,
          role: 'Admin',
        },
      });

    /*
    |--------------------------------------------------------------------------
    | ADMIN SESSION COOKIE
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