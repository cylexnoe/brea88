import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

import { getClientKey, rateLimit } from '@/lib/rate-limit';

const ADMIN_SESSION_COOKIE = 'admin_session';
const AGENT_SESSION_COOKIE = 'agent_session';
const ADMIN_SESSION_DURATION = 60 * 60 * 2 * 1000;
const AGENT_SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isValidAdminSession(token: string | undefined): boolean {
  if (!token || token.length > 160) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [timestamp, signature] = parts;
  if (!/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isSafeInteger(timestampNumber)) return false;
  const age = Date.now() - timestampNumber;
  if (age < 0 || age > ADMIN_SESSION_DURATION) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;

  const expected = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return safeCompare(signature, expected);
}

function isValidAgentSession(token: string | undefined): boolean {
  if (!token || token.length > 220) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [agentIdString, timestampString, signature] = parts;
  if (!/^\d+$/.test(agentIdString) || !/^\d{13}$/.test(timestampString) || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const agentId = Number(agentIdString);
  const timestamp = Number(timestampString);
  if (!Number.isSafeInteger(agentId) || agentId <= 0 || !Number.isSafeInteger(timestamp)) return false;

  const age = Date.now() - timestamp;
  if (age < 0 || age > AGENT_SESSION_DURATION) return false;

  const secret = process.env.AGENT_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;

  const payload = `${agentId}.${timestamp}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return safeCompare(signature, expected);
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin') return addSecurityHeaders(NextResponse.next());

  if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isValidAdminSession(token)) {
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('auth', 'required');
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    const token = request.cookies.get(AGENT_SESSION_COOKIE)?.value;
    if (!isValidAgentSession(token)) {
      const loginUrl = new URL('/agent/login', request.url);
      loginUrl.searchParams.set('auth', 'required');
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  if (pathname === '/api/inquiries' && request.method === 'POST') {
    const limit = rateLimit(getClientKey(request, 'public-inquiry'), 12);
    if (!limit.allowed) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, message: 'Too many inquiries. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
        ),
      );
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/api/inquiries'],
};
