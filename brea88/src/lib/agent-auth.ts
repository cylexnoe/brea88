import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'agent_session';

const SESSION_DURATION =
  1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret =
    process.env.AGENT_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      'AGENT_SESSION_SECRET is not configured.'
    );
  }

  return secret;
}

function createSignature(payload: string) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
}

export function createAgentSessionToken(
  agentId: number
) {
  const timestamp = Date.now();

  const payload = `${agentId}.${timestamp}`;

  const signature =
    createSignature(payload);

  return `${payload}.${signature}`;
}

export function verifyAgentSessionToken(
  token: string | undefined
) {
  if (!token) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
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
    return null;
  }

  const payload =
    `${agentId}.${timestamp}`;

  const expectedSignature =
    createSignature(payload);

  const actualBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expectedSignature);

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

  const age =
    Date.now() - timestamp;

  if (
    age < 0 ||
    age > SESSION_DURATION
  ) {
    return null;
  }

  return agentId;
}

export async function getCurrentAgentId() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  return verifyAgentSessionToken(token);
}

export async function isAgentAuthenticated() {
  const agentId =
    await getCurrentAgentId();

  return agentId !== null;
}

export function setAgentSessionCookie(
  response: Response,
  agentId: number
) {
  const token =
    createAgentSessionToken(agentId);

  const secure =
    process.env.NODE_ENV ===
    'production'
      ? '; Secure'
      : '';

  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`
  );
}

export function clearAgentSessionCookie(
  response: Response
) {
  const secure =
    process.env.NODE_ENV ===
    'production'
      ? '; Secure'
      : '';

  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}