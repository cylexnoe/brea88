import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/*
|--------------------------------------------------------------------------
| AGENT SESSION CONFIGURATION
|--------------------------------------------------------------------------
*/

const SESSION_COOKIE = 'agent_session';

// 30 days
const SESSION_DURATION =
  1000 * 60 * 60 * 24 * 30;

const SESSION_MAX_AGE =
  60 * 60 * 24 * 30;

/*
|--------------------------------------------------------------------------
| SESSION SECRET
|--------------------------------------------------------------------------
|
| Agent authentication must have its own secret.
|
| IMPORTANT:
| Do NOT fall back to ADMIN_SESSION_SECRET.
|
| Admin and Agent authentication should use separate secrets.
|
*/

function getSecret(): string {
  const secret =
    process.env.AGENT_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      'AGENT_SESSION_SECRET is not configured.'
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
  payload: string
): string {
  return crypto
    .createHmac(
      'sha256',
      getSecret()
    )
    .update(payload)
    .digest('hex');
}

/*
|--------------------------------------------------------------------------
| CREATE AGENT SESSION TOKEN
|--------------------------------------------------------------------------
|
| Format:
|
| agentId.timestamp.signature
|
*/

export function createAgentSessionToken(
  agentId: number
): string {
  if (
    !Number.isInteger(agentId) ||
    agentId <= 0
  ) {
    throw new Error(
      'Invalid agent ID.'
    );
  }

  const timestamp =
    Date.now();

  const payload =
    `${agentId}.${timestamp}`;

  const signature =
    createSignature(payload);

  return `${payload}.${signature}`;
}

/*
|--------------------------------------------------------------------------
| VERIFY AGENT SESSION TOKEN
|--------------------------------------------------------------------------
*/

export function verifyAgentSessionToken(
  token: string | undefined
): number | null {
  if (!token) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | TOKEN LENGTH PROTECTION
  |--------------------------------------------------------------------------
  */

  if (token.length > 500) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | TOKEN FORMAT
  |--------------------------------------------------------------------------
  */

  const parts =
    token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [
    agentIdString,
    timestampString,
    signature,
  ] = parts;

  /*
  |--------------------------------------------------------------------------
  | BASIC TOKEN VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !/^\d+$/.test(agentIdString) ||
    !/^\d+$/.test(timestampString) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return null;
  }

  const agentId =
    Number(agentIdString);

  const timestamp =
    Number(timestampString);

  if (
    !Number.isSafeInteger(agentId) ||
    agentId <= 0
  ) {
    return null;
  }

  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp <= 0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | RECREATE PAYLOAD
  |--------------------------------------------------------------------------
  */

  const payload =
    `${agentId}.${timestamp}`;

  const expectedSignature =
    createSignature(payload);

  /*
  |--------------------------------------------------------------------------
  | CONSTANT-TIME SIGNATURE COMPARISON
  |--------------------------------------------------------------------------
  */

  const actualBuffer =
    Buffer.from(
      signature,
      'utf8'
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      'utf8'
    );

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      actualBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | SESSION EXPIRATION
  |--------------------------------------------------------------------------
  */

  const age =
    Date.now() - timestamp;

  if (
    age < 0 ||
    age > SESSION_DURATION
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | VALID SESSION
  |--------------------------------------------------------------------------
  */

  return agentId;
}

/*
|--------------------------------------------------------------------------
| GET CURRENT AGENT ID
|--------------------------------------------------------------------------
*/

export async function getCurrentAgentId(): Promise<
  number | null
> {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    return verifyAgentSessionToken(
      token
    );
  } catch (error) {
    console.error(
      'Failed to read agent session:',
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK AGENT AUTHENTICATION
|--------------------------------------------------------------------------
*/

export async function isAgentAuthenticated(): Promise<boolean> {
  const agentId =
    await getCurrentAgentId();

  return agentId !== null;
}

/*
|--------------------------------------------------------------------------
| GET CURRENT AGENT
|--------------------------------------------------------------------------
|
| This is the preferred helper for protected Agent routes.
|
| The browser does NOT provide the agent ID.
|
| The ID comes from the signed HttpOnly session cookie.
|
*/

export async function getAgentFromSession() {
  const agentId =
    await getCurrentAgentId();

  if (!agentId) {
    return null;
  }

  const agent =
    await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        slug: true,
        phone: true,
        profileImage: true,
        bio: true,
        facebook: true,
        messenger: true,
        isActive: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT MUST EXIST, BE ACTIVE, AND HAVE AN AGENT ROLE
  |--------------------------------------------------------------------------
  |
  | A signed session only proves that the session was created by the
  | application. It must not bypass the current database role.
  |
  | This prevents an old Agent/Broker session from continuing to access
  | Agent APIs after the account role has been changed to another role.
  |
  */

  if (
    !agent ||
    !agent.isActive ||
    !['Agent', 'Broker'].includes(agent.role)
  ) {
    return null;
  }

  return agent;
}

/*
|--------------------------------------------------------------------------
| SET AGENT SESSION COOKIE
|--------------------------------------------------------------------------
*/

export function setAgentSessionCookie(
  response: Response,
  agentId: number
): void {
  const token =
    createAgentSessionToken(
      agentId
    );

  const secure =
    process.env.NODE_ENV ===
    'production'
      ? '; Secure'
      : '';

  response.headers.append(
    'Set-Cookie',
    [
      `${SESSION_COOKIE}=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${SESSION_MAX_AGE}`,
      'Priority=High',
      secure.replace('; ', ''),
    ]
      .filter(Boolean)
      .join('; ')
  );
}

/*
|--------------------------------------------------------------------------
| CLEAR AGENT SESSION COOKIE
|--------------------------------------------------------------------------
*/

export function clearAgentSessionCookie(
  response: Response
): void {
  const secure =
    process.env.NODE_ENV ===
    'production'
      ? '; Secure'
      : '';

  response.headers.append(
    'Set-Cookie',
    [
      `${SESSION_COOKIE}=`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=0',
      'Priority=High',
      secure.replace('; ', ''),
    ]
      .filter(Boolean)
      .join('; ')
  );
}
