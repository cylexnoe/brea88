import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { createAdminSessionToken } from '@/lib/admin-auth';
import { hasValidContentLength } from '@/lib/security';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'admin-login'), 8);

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!hasValidContentLength(request, 16 * 1024)) {
    return NextResponse.json(
      { success: false, message: 'Request is too large.' },
      { status: 413 },
    );
  }

  try {
    const body: unknown = await request.json().catch(() => null);

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid login data.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const username = typeof data.username === 'string' ? data.username.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';

    if (!username || !password || username.length > 100 || password.length > 128) {
      return NextResponse.json({ success: false, message: 'Invalid username or password.' }, { status: 401 });
    }

    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword || adminUsername.length > 100 || adminPassword.length > 128) {
      console.error('Admin authentication is not configured correctly.');
      return NextResponse.json({ success: false, message: 'Unable to process login.' }, { status: 500 });
    }

    const usernameMatches = safeCompare(username, adminUsername);
    const passwordMatches = safeCompare(password, adminPassword);

    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password.' },
        { status: 401 },
      );
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful.',
      admin: { username: adminUsername, role: 'Admin' },
    });

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2,
      path: '/',
      priority: 'high',
    });

    return response;
  } catch (error) {
    console.error('Admin login failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'Unable to process login.' },
      { status: 500 },
    );
  }
}
