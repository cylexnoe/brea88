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

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const fullName =
      typeof body.fullName === 'string'
        ? body.fullName.trim()
        : '';

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    const role =
      body.role === 'Broker'
        ? 'Broker'
        : 'Agent';

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Full name is required.',
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email is required.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters.',
        },
        { status: 400 }
      );
    }

    const existingAgent =
      await prisma.agent.findUnique({
        where: { email },
      });

    if (existingAgent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An account with this email already exists.',
        },
        { status: 409 }
      );
    }

    let slug =
      createSlug(fullName);

    const existingSlug =
      await prisma.agent.findUnique({
        where: { slug },
      });

    if (existingSlug) {
      slug =
        `${slug}-${Date.now()}`;
    }

    const agent =
      await prisma.agent.create({
        data: {
          fullName,
          email,
          passwordHash:
            hashPassword(password),
          role,
          slug,
        },
      });

    const token =
      createAgentSessionToken(
        agent.id
      );

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            'Account created successfully.',
          agent: {
            id: agent.id,
            fullName: agent.fullName,
            email: agent.email,
            role: agent.role,
            slug: agent.slug,
          },
        },
        { status: 201 }
      );

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
      'Agent registration error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to create agent account.',
      },
      { status: 500 }
    );
  }
}