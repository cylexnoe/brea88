import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const MIN_SECRET_LENGTH = 32;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be configured with at least 32 characters.',
    );
  }

  return secret;
}

function createSignature(timestamp: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(timestamp)
    .digest('hex');
}

export function createAdminSessionToken(): string {
  const timestamp = Date.now().toString();

  return `${timestamp}.${createSignature(timestamp)}`;
}

export function isValidSessionToken(
  token: string | undefined,
): boolean {
  if (!token || token.length > 160) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] = parts;

  if (
    !/^\d{13}$/.test(timestamp) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isSafeInteger(timestampNumber)) {
    return false;
  }

  /*
   * IMPORTANT:
   *
   * There is intentionally NO session expiration check here.
   *
   * The timestamp is used only as part of the signed token.
   * The HMAC signature prevents someone from modifying it.
   *
   * The session will remain valid until:
   *
   * 1. The admin logs out and the cookie is removed.
   * 2. ADMIN_SESSION_SECRET is changed.
   * 3. The browser removes the persistent cookie.
   */

  const expectedSignature = createSignature(timestamp);

  const actual = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');

  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    return isValidSessionToken(
      cookieStore.get(SESSION_COOKIE)?.value,
    );
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('UNAUTHORIZED');
  }
}

