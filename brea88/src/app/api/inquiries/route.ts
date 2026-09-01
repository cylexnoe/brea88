import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

/* =========================================================
   GET INQUIRIES

   - Only logged-in agents can access inquiries.
   - Agents only see inquiries assigned to themselves.
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

   IMPORTANT:

   The client sends:

   - name
   - email
   - phone
   - message
   - propertyId

   The client DOES NOT send agentId.

   The authenticated agent is determined from the
   agent session.

   After creating the inquiry:

   Resend sends an email to:

   agent.email
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
          message:
            'Client name must contain at least 2 characters.',
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
       VERIFY AGENT EMAIL
    ======================================================= */

    if (!agent.email || !agent.email.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The assigned agent does not have a registered email address.',
        },
        { status: 400 }
      );
    }

    const agentEmail = agent.email.trim().toLowerCase();

    /* =======================================================
       VERIFY PROPERTY
    ======================================================= */

    const property = await prisma.property.findUnique({
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

       agentId comes ONLY from the authenticated session.

       We intentionally DO NOT use:

       data.agentId
    ======================================================= */

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        message,
        propertyId,

        // Agent comes from authenticated session.
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
       SEND EMAIL THROUGH RESEND

       The email recipient is the agent's registered email.

       Example:

       Agent.email = agent@gmail.com

       Resend sends to:

       agent@gmail.com
    ======================================================= */

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      console.error(
        'RESEND_FROM_EMAIL is not configured.'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Inquiry was saved, but email configuration is missing.',
          inquiry,
        },
        { status: 201 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error(
        'RESEND_API_KEY is not configured.'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Inquiry was saved, but Resend API configuration is missing.',
          inquiry,
        },
        { status: 201 }
      );
    }

    try {
      const resendResult = await resend.emails.send({
        from: fromEmail,

        to: [agentEmail],

        replyTo: email,

        subject: `New Property Inquiry - ${property.title}`,

        text: `
NEW PROPERTY INQUIRY
====================

A client has submitted a property inquiry.

PROPERTY
--------
Title: ${property.title}
Price: ₱${Number(
          String(property.price).replace(
            /[^0-9.]/g,
            ''
          )
        ).toLocaleString('en-US')}
Location: ${property.location}

CLIENT
------
Name: ${name}
Email: ${email}
Phone: ${phone}

MESSAGE
-------
${message}

INQUIRY INFORMATION
-------------------
Inquiry ID: ${inquiry.id}
Status: ${inquiry.status}
Submitted: ${inquiry.createdAt.toLocaleString()}

AGENT
-----
Name: ${agent.fullName}
Email: ${agentEmail}

You can reply directly to this email to contact the client.

BREA 88 REALTY
Service with a Heart
        `.trim(),

        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; padding: 30px;">
            
            <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
              
              <div style="background-color: #020617; padding: 30px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                  New Property Inquiry
                </h1>

                <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                  BREA 88 Realty
                </p>
              </div>

              <div style="padding: 30px;">

                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                  Hello <strong>${agent.fullName}</strong>,
                </p>

                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  A client has submitted a new inquiry about one of your property listings.
                </p>

                <!-- PROPERTY -->

                <div style="margin-top: 25px; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">

                  <h2 style="margin: 0 0 15px; font-size: 16px; color: #0f172a;">
                    Property Details
                  </h2>

                  <p style="margin: 8px 0; font-size: 14px; color: #475569;">
                    <strong>Property:</strong>
                    ${property.title}
                  </p>

                  <p style="margin: 8px 0; font-size: 14px; color: #475569;">
                    <strong>Price:</strong>
                    ₱${Number(
                      String(property.price).replace(
                        /[^0-9.]/g,
                        ''
                      )
                    ).toLocaleString('en-US')}
                  </p>

                  <p style="margin: 8px 0; font-size: 14px; color: #475569;">
                    <strong>Location:</strong>
                    ${property.location}
                  </p>

                </div>

                <!-- CLIENT -->

                <div style="margin-top: 20px; padding: 20px; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">

                  <h2 style="margin: 0 0 15px; font-size: 16px; color: #1e3a8a;">
                    Client Information
                  </h2>

                  <p style="margin: 8px 0; font-size: 14px; color: #334155;">
                    <strong>Name:</strong>
                    ${name}
                  </p>

                  <p style="margin: 8px 0; font-size: 14px; color: #334155;">
                    <strong>Email:</strong>
                    <a
                      href="mailto:${email}"
                      style="color: #1d4ed8;"
                    >
                      ${email}
                    </a>
                  </p>

                  <p style="margin: 8px 0; font-size: 14px; color: #334155;">
                    <strong>Phone:</strong>
                    <a
                      href="tel:${phone}"
                      style="color: #1d4ed8;"
                    >
                      ${phone}
                    </a>
                  </p>

                </div>

                <!-- MESSAGE -->

                <div style="margin-top: 20px; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">

                  <h2 style="margin: 0 0 15px; font-size: 16px; color: #0f172a;">
                    Client Message
                  </h2>

                  <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.7; white-space: pre-line;">
                    ${message}
                  </p>

                </div>

                <!-- REPLY BUTTON -->

                <div style="margin-top: 25px; text-align: center;">

                  <a
                    href="mailto:${email}?subject=Re: Property Inquiry - ${encodeURIComponent(property.title)}"
                    style="display: inline-block; padding: 13px 22px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: bold;"
                  >
                    Reply to Client
                  </a>

                </div>

                <!-- FOOTER -->

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">

                  <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                    Inquiry ID: ${inquiry.id}<br />
                    Status: ${inquiry.status}<br />
                    Submitted: ${inquiry.createdAt.toLocaleString()}
                  </p>

                  <p style="margin-top: 15px; margin-bottom: 0; font-size: 13px; font-weight: bold; color: #0f172a;">
                    BREA 88 REALTY
                  </p>

                  <p style="margin-top: 3px; margin-bottom: 0; font-size: 12px; color: #64748b;">
                    Service with a Heart
                  </p>

                </div>

              </div>

            </div>

          </div>
        `,
      });

      if (resendResult.error) {
        console.error(
          'Resend email error:',
          resendResult.error
        );

        return NextResponse.json(
          {
            success: true,
            emailSent: false,
            message:
              'Inquiry was saved, but the email could not be sent.',
            inquiry,
          },
          { status: 201 }
        );
      }

      console.log(
        `Inquiry email sent successfully to ${agentEmail}`
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: true,
          message:
            'Inquiry submitted and sent to the assigned agent successfully.',
          inquiry,
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error(
        'Failed to send inquiry email:',
        emailError
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            'Inquiry was saved successfully, but the email could not be sent.',
          inquiry,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(
      'POST /api/inquiries error:',
      error
    );

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

   - Agent can update their own inquiry.
   - Agent cannot update another agent's inquiry.
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
          message:
            'Unauthorized. Please log in as an agent.',
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

       We check:

       id
       +
       agentId

       This prevents an agent from modifying another
       agent's inquiry.
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
        message:
          'Inquiry status updated successfully.',
        inquiry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'PATCH /api/inquiries error:',
      error
    );

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

