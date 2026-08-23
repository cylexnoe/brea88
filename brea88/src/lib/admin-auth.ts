import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION = 60 * 60 * 2 * 1000; // 2 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }

  return secret;
}

function createSignature(timestamp: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(timestamp)
    .digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function isValidSessionToken(
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

  const expectedSignature = createSignature(timestamp);

  return safeCompare(signature, expectedSignature);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();

  const session = cookieStore.get(SESSION_COOKIE)?.value;

  return isValidSessionToken(session);
}

export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    throw new Error('UNAUTHORIZED');
  }
}