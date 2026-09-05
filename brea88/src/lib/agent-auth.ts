import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE = 'agent_session';
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const MIN_SECRET_LENGTH = 32;

function getSecret(): string {
  const secret = process.env.AGENT_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error('AGENT_SESSION_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

function createSignature(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createAgentSessionToken(agentId: number): string {
  if (!Number.isSafeInteger(agentId) || agentId <= 0) {
    throw new Error('Invalid agent ID.');
  }

  const timestamp = Date.now().toString();
  const payload = `${agentId}.${timestamp}`;
  return `${payload}.${createSignature(payload)}`;
}

export function verifyAgentSessionToken(token: string | undefined): number | null {
  if (!token || token.length > 220) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [agentIdString, timestampString, signature] = parts;

  if (!/^\d+$/.test(agentIdString) || !/^\d{13}$/.test(timestampString) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return null;
  }

  const agentId = Number(agentIdString);
  const timestamp = Number(timestampString);

  if (!Number.isSafeInteger(agentId) || agentId <= 0 || !Number.isSafeInteger(timestamp)) return null;

  const age = Date.now() - timestamp;
  if (age < 0 || age > SESSION_DURATION) return null;

  const expectedSignature = createSignature(`${agentId}.${timestamp}`);
  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  return agentId;
}

export async function getCurrentAgentId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    return verifyAgentSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function isAgentAuthenticated(): Promise<boolean> {
  return (await getCurrentAgentId()) !== null;
}

export async function getAgentFromSession() {
  const agentId = await getCurrentAgentId();
  if (!agentId) return null;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
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

  if (!agent || !agent.isActive || !['Agent', 'Broker'].includes(agent.role)) {
    return null;
  }

  return agent;
}

export function setAgentSessionCookie(response: Response, agentId: number): void {
  const token = createAgentSessionToken(agentId);
  response.headers.append(
    'Set-Cookie',
    [
      `${SESSION_COOKIE}=${token}`,
      'Path=/',
      'HttpOnly',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
      'SameSite=Strict',
      `Max-Age=${SESSION_MAX_AGE}`,
      'Priority=High',
    ].filter(Boolean).join('; '),
  );
}

export function clearAgentSessionCookie(response: Response): void {
  response.headers.append(
    'Set-Cookie',
    [
      `${SESSION_COOKIE}=`,
      'Path=/',
      'HttpOnly',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
      'SameSite=Strict',
      'Max-Age=0',
      'Priority=High',
    ].filter(Boolean).join('; '),
  );
}
