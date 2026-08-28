import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';

export async function PUT(request: Request) {
  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    // =========================================================
    // REQUEST BODY
    // =========================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // =========================================================
    // CLEAN INPUT
    // =========================================================

    const fullName =
      typeof data.fullName === 'string'
        ? data.fullName.trim()
        : '';

    const email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : '';

    const phone =
      typeof data.phone === 'string'
        ? data.phone.trim() || null
        : null;

    const address =
      typeof data.address === 'string'
        ? data.address.trim() || null
        : null;

    const bio =
      typeof data.bio === 'string'
        ? data.bio.trim() || null
        : null;

    const facebook =
      typeof data.facebook === 'string'
        ? data.facebook.trim() || null
        : null;

    const messenger =
      typeof data.messenger === 'string'
        ? data.messenger.trim() || null
        : null;

    const profileImage =
      typeof data.profileImage === 'string'
        ? data.profileImage.trim() || null
        : null;

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is required.',
        },
        { status: 400 }
      );
    }

    if (fullName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name must contain at least 2 characters.',
        },
        { status: 400 }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is too long.',
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required.',
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is too long.',
        },
        { status: 400 }
      );
    }

    if (phone && phone.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number is too long.',
        },
        { status: 400 }
      );
    }

    if (address && address.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: 'Address is too long.',
        },
        { status: 400 }
      );
    }

    if (bio && bio.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bio is too long.',
        },
        { status: 400 }
      );
    }

    if (facebook && facebook.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: 'Facebook link is too long.',
        },
        { status: 400 }
      );
    }

    if (messenger && messenger.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: 'Messenger link is too long.',
        },
        { status: 400 }
      );
    }

    if (profileImage && profileImage.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Profile image URL is too long.',
        },
        { status: 400 }
      );
    }

    // =========================================================
    // EMAIL UNIQUENESS
    // =========================================================
    //
    // IMPORTANT:
    // We identify the current agent ONLY from the server-side
    // session. We never accept an agent ID from the browser.
    //
    // Therefore:
    //
    // Agent A cannot submit:
    // { id: Agent B }
    //
    // because this endpoint never uses a client-provided ID.
    // =========================================================

    const existingEmail = await prisma.agent.findFirst({
      where: {
        email,
        NOT: {
          id: agent.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already being used.',
        },
        { status: 409 }
      );
    }

    // =========================================================
    // UPDATE CURRENT AGENT ONLY
    // =========================================================

    const updatedAgent = await prisma.agent.update({
      where: {
        id: agent.id,
      },

      data: {
        fullName,
        email,
        phone,
        address,
        bio,
        facebook,
        messenger,
        profileImage,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        slug: true,
        phone: true,
        address: true,
        profileImage: true,
        bio: true,
        facebook: true,
        messenger: true,
        isActive: true,
      },
    });

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully.',
        agent: updatedAgent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'PUT /api/agent/profile/update error:',
      error
    );

    // Prisma unique constraint
    // Handles a race condition where another request
    // creates/updates the same email simultaneously.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already being used.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update profile.',
      },
      { status: 500 }
    );
  }
}

