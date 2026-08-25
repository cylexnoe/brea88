import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_SESSION_COOKIE = 'admin_session';
const AGENT_SESSION_COOKIE = 'agent_session';

const ADMIN_SESSION_DURATION = 60 * 60 * 2 * 1000;
const AGENT_SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

function isValidAdminSessionToken(
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

function isValidAgentSessionToken(
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
    agentId,
    timestamp,
    signature,
  ] = parts;

  if (!agentId || !timestamp || !signature) {
    return false;
  }

  const agentIdNumber = Number(agentId);
  const timestampNumber = Number(timestamp);

  if (
    !Number.isInteger(agentIdNumber) ||
    agentIdNumber <= 0 ||
    !Number.isFinite(timestampNumber)
  ) {
    return false;
  }

  const age =
    Date.now() - timestampNumber;

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
  const { pathname } = request.nextUrl;

  // =====================================================
  // ADMIN PROTECTION
  // =====================================================

  if (pathname.startsWith('/admin')) {
    const sessionToken =
      request.cookies.get(
        ADMIN_SESSION_COOKIE
      )?.value;

    if (
      !isValidAdminSessionToken(
        sessionToken
      )
    ) {
      const loginUrl =
        new URL('/', request.url);

      loginUrl.searchParams.set(
        'auth',
        'required'
      );

      return NextResponse.redirect(
        loginUrl
      );
    }
  }

  // =====================================================
  // AGENT / BROKER PROTECTION
  // =====================================================

  if (pathname === '/profile') {
    const sessionToken =
      request.cookies.get(
        AGENT_SESSION_COOKIE
      )?.value;

    if (
      !isValidAgentSessionToken(
        sessionToken
      )
    ) {
      const loginUrl =
        new URL(
          '/agent/login',
          request.url
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
    '/profile',
  ],
};