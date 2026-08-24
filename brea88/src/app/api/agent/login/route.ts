import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import {
  createAgentSessionToken,
} from '@/lib/agent-auth';

function hashPassword(password: string) {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email and password are required.',
        },
        { status: 400 }
      );
    }

    const agent =
      await prisma.agent.findUnique({
        where: { email },
      });

    if (!agent || !agent.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    const passwordHash =
      hashPassword(password);

    if (
      passwordHash !==
      agent.passwordHash
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    const token =
      createAgentSessionToken(
        agent.id
      );

    const response =
      NextResponse.json({
        success: true,
        message:
          'Login successful.',
        agent: {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          role: agent.role,
          slug: agent.slug,
        },
      });

    response.cookies.set({
      name: 'agent_session',
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      maxAge:
        60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      'Agent login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process login.',
      },
      { status: 500 }
    );
  }
}