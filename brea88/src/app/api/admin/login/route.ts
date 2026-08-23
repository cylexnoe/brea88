import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_COOKIE = 'admin_session';

function createSessionToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }

  const timestamp = Date.now().toString();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');

  return `${timestamp}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body.username === 'string'
        ? body.username.trim()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error(
        'Admin authentication environment variables are not configured.'
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Server authentication is not configured.',
        },
        { status: 500 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username and password are required.',
        },
        { status: 400 }
      );
    }

    const usernameMatches =
      crypto.timingSafeEqual(
        Buffer.from(username),
        Buffer.from(validUsername)
      );

    const passwordMatches =
      crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(validPassword)
      );

    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password.',
        },
        { status: 401 }
      );
    }

    const token = createSessionToken();

    const response = NextResponse.json(
      {
        success: true,
        message: 'Authentication successful.',
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to process login.',
      },
      { status: 500 }
    );
  }
}