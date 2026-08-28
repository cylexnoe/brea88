import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';



function cleanString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

/* =========================================================
   GET INQUIRIES
   - Only the currently logged-in agent can access inquiries
   - Agents only see inquiries assigned to themselves
========================================================= */

export async function GET() {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please log in as an agent.',
        },
        { status: 401 }
      );
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            image: true,
            category: true,
            propertyType: true,
            houseType: true,
            storey: true,
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        inquiries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/inquiries error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load inquiries.',
        debug:
          process.env.NODE_ENV !== 'production' &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST INQUIRY
   - Client sends property + personal information
   - agentId is NEVER accepted from the client
   - The logged-in agent is automatically assigned
========================================================= */

export async function POST(request: Request) {
  try {
    /* =======================================================
       GET CURRENTLY LOGGED-IN AGENT
    ======================================================= */

    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You must be logged in as an active agent to submit an inquiry.',
        },
        { status: 401 }
      );
    }

    /* =======================================================
       READ REQUEST BODY
    ======================================================= */

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
          message: 'Invalid inquiry data.',
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    /* =======================================================
       CLIENT INFORMATION
    ======================================================= */

    const name = cleanString(data.name);

    const email = cleanString(data.email).toLowerCase();

    const phone = cleanString(data.phone);

    const message = cleanString(data.message);

    /* =======================================================
       PROPERTY ID
    ======================================================= */

    const propertyId = Number(data.propertyId);

    /* =======================================================
       VALIDATION
    ======================================================= */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client name is required.',
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client name must contain at least 2 characters.',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client name is too long.',
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client email is required.',
        },
        { status: 400 }
      );
    }

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

    if (email.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is too long.',
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client phone number is required.',
        },
        { status: 400 }
      );
    }

    if (phone.length < 7) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid phone number.',
        },
        { status: 400 }
      );
    }

    if (phone.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number is too long.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Inquiry message is required.',
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Inquiry message is too long.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(propertyId) ||
      propertyId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    /* =======================================================
       VERIFY PROPERTY
    ======================================================= */

    const property =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        select: {
          id: true,
          title: true,
          price: true,
          location: true,
        },
      });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        { status: 404 }
      );
    }

    /* =======================================================
       CREATE INQUIRY
       
       IMPORTANT:
       
       agentId comes ONLY from the authenticated session.
       
       We intentionally DO NOT use:
       
       data.agentId
       
       This prevents the browser/client from choosing
       which agent receives the inquiry.
    ======================================================= */

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        message,

        propertyId,

        // Automatically assigned to the logged-in agent.
        agentId: agent.id,

        status: 'New',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            image: true,
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    /* =======================================================
       SUCCESS
    ======================================================= */

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry submitted successfully.',
        inquiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/inquiries error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit inquiry.',
        debug:
          process.env.NODE_ENV !== 'production' &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH INQUIRY STATUS
   - Agent can update the status of their own inquiry
   - Agent cannot modify another agent's inquiry
========================================================= */

export async function PATCH(request: Request) {
  try {
    /* =======================================================
       GET CURRENT AGENT
    ======================================================= */

    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please log in as an agent.',
        },
        { status: 401 }
      );
    }

    /* =======================================================
       READ BODY
    ======================================================= */

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
          message: 'Invalid request data.',
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const inquiryId = Number(data.id);

    const status = cleanString(data.status);

    /* =======================================================
       VALIDATION
    ======================================================= */

    if (
      !Number.isInteger(inquiryId) ||
      inquiryId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid inquiry ID.',
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      'New',
      'Contacted',
      'Viewing Scheduled',
      'Viewing Completed',
      'Follow Up',
      'Closed',
      'Cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid inquiry status.',
          allowedStatuses,
        },
        { status: 400 }
      );
    }

    /* =======================================================
       FIND INQUIRY
       
       IMPORTANT:
       
       We check BOTH:
       
       id
       agentId
       
       This prevents an agent from changing another
       agent's inquiry simply by knowing its ID.
    ======================================================= */

    const existingInquiry =
      await prisma.inquiry.findFirst({
        where: {
          id: inquiryId,
          agentId: agent.id,
        },
      });

    if (!existingInquiry) {
      return NextResponse.json(
        {
          success: false,
          message: 'Inquiry not found.',
        },
        { status: 404 }
      );
    }

    /* =======================================================
       UPDATE STATUS
    ======================================================= */

    const inquiry =
      await prisma.inquiry.update({
        where: {
          id: existingInquiry.id,
        },
        data: {
          status,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              image: true,
            },
          },
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              phone: true,
              profileImage: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry status updated successfully.',
        inquiry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/inquiries error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update inquiry.',
        debug:
          process.env.NODE_ENV !== 'production' &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

