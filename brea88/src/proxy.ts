import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION = 60 * 60 * 2 * 1000;

function isValidSessionToken(
  token: string | undefined
): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] = parts;

  if (!timestamp || !signature) {
    return false;
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const age = Date.now() - timestampNumber;

  if (age < 0 || age > SESSION_DURATION) {
    return false;
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get(
      SESSION_COOKIE
    )?.value;

    if (!isValidSessionToken(sessionToken)) {
      const loginUrl = new URL('/', request.url);

      loginUrl.searchParams.set(
        'auth',
        'required'
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};