import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_SESSION_COOKIE = 'admin_session';
const AGENT_SESSION_COOKIE = 'agent_session';

const ADMIN_SESSION_DURATION = 60 * 60 * 2 * 1000; // 2 hours
const AGENT_SESSION_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

function isValidAdminSession(
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

  if (
    age < 0 ||
    age > ADMIN_SESSION_DURATION
  ) {
    return false;
  }

  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac('sha256', secret)
      .update(timestamp)
      .digest('hex');

  const actualBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expectedSignature);

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}

function isValidAgentSession(
  token: string | undefined
): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    return false;
  }

  const [
    agentIdString,
    timestampString,
    signature,
  ] = parts;

  const agentId = Number(agentIdString);
  const timestamp = Number(timestampString);

  if (
    !Number.isInteger(agentId) ||
    agentId <= 0 ||
    !Number.isFinite(timestamp)
  ) {
    return false;
  }

  const age = Date.now() - timestamp;

  if (
    age < 0 ||
    age > AGENT_SESSION_DURATION
  ) {
    return false;
  }

  const secret =
    process.env.AGENT_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const payload =
    `${agentId}.${timestamp}`;

  const expectedSignature =
    crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  const actualBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expectedSignature);

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}

export function proxy(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  /*
   * =========================================================
   * ADMIN PROTECTION
   * =========================================================
   */

  if (
    pathname.startsWith('/admin')
  ) {
    const sessionToken =
      request.cookies.get(
        ADMIN_SESSION_COOKIE
      )?.value;

    if (
      !isValidAdminSession(
        sessionToken
      )
    ) {
      const loginUrl =
        new URL(
          '/',
          request.url
        );

      loginUrl.searchParams.set(
        'auth',
        'required'
      );

      return NextResponse.redirect(
        loginUrl
      );
    }
  }

  /*
   * =========================================================
   * AGENT / BROKER PROTECTION
   * =========================================================
   *
   * /profile is the private agent/broker profile.
   *
   * Clients who are not logged in as an agent/broker
   * cannot access this route.
   */

  if (
    pathname === '/profile' ||
    pathname.startsWith('/profile/')
  ) {
    const agentSessionToken =
      request.cookies.get(
        AGENT_SESSION_COOKIE
      )?.value;

    if (
      !isValidAgentSession(
        agentSessionToken
      )
    ) {
      const loginUrl =
        new URL(
          '/agent/login',
          request.url
        );

      loginUrl.searchParams.set(
        'auth',
        'required'
      );

      return NextResponse.redirect(
        loginUrl
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
  ],
};