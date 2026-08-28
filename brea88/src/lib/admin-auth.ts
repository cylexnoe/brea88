import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';

// Admin session expires after 2 hours.
const SESSION_DURATION =
  60 * 60 * 2 * 1000;

/*
|--------------------------------------------------------------------------
| ADMIN SESSION SECRET
|--------------------------------------------------------------------------
*/

function getSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      'ADMIN_SESSION_SECRET is not configured'
    );
  }

  return secret;
}

/*
|--------------------------------------------------------------------------
| CREATE SIGNATURE
|--------------------------------------------------------------------------
*/

function createSignature(
  timestamp: string
): string {
  return crypto
    .createHmac(
      'sha256',
      getSecret()
    )
    .update(timestamp)
    .digest('hex');
}

/*
|--------------------------------------------------------------------------
| SAFE STRING COMPARISON
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
| CREATE ADMIN SESSION TOKEN
|--------------------------------------------------------------------------
|
| Format:
|
| timestamp.signature
|
| The timestamp is signed using HMAC-SHA256.
|--------------------------------------------------------------------------
*/

export function createAdminSessionToken(): string {
  const timestamp =
    Date.now().toString();

  const signature =
    createSignature(timestamp);

  return `${timestamp}.${signature}`;
}

/*
|--------------------------------------------------------------------------
| VALIDATE ADMIN SESSION TOKEN
|--------------------------------------------------------------------------
*/

export function isValidSessionToken(
  token: string | undefined
): boolean {
  if (!token) {
    return false;
  }

  const parts =
    token.split('.');

  if (parts.length !== 2) {
    return false;
  }

  const [
    timestamp,
    signature,
  ] = parts;

  if (
    !timestamp ||
    !signature
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE TIMESTAMP
  |--------------------------------------------------------------------------
  */

  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE SESSION AGE
  |--------------------------------------------------------------------------
  */

  const age =
    Date.now() -
    timestampNumber;

  /*
  | Reject:
  |
  | - Future timestamps
  | - Expired sessions
  |--------------------------------------------------------------------------
  */

  if (
    age < 0 ||
    age > SESSION_DURATION
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFY SIGNATURE
  |--------------------------------------------------------------------------
  */

  const expectedSignature =
    createSignature(timestamp);

  return safeCompare(
    signature,
    expectedSignature
  );
}

/*
|--------------------------------------------------------------------------
| CHECK ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore =
    await cookies();

  const session =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  return isValidSessionToken(
    session
  );
}

/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN
|--------------------------------------------------------------------------
|
| Useful for protected server-side operations.
|--------------------------------------------------------------------------
*/

export async function requireAdmin(): Promise<void> {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    throw new Error(
      'UNAUTHORIZED'
    );
  }
}

