import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
   GET INQUIRIES

   Only logged-in agents can view inquiries.

   Each Agent/Broker can only see inquiries assigned
   to their own account.
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

   Public client submits:

   - name
   - email
   - phone
   - message
   - propertyId
   - agentSlug

   The browser does NOT send:

   - agentId
   - agent email

   The server finds the real Agent from PostgreSQL.

   Flow:

   Client
      ↓
   Send Inquiry
      ↓
   propertyId + agentSlug
      ↓
   Verify Agent
      ↓
   Verify Property
      ↓
   Verify Property belongs to Agent
      ↓
   Create Inquiry
      ↓
   Agent Dashboard
      ↓
   Send email notification
========================================================= */

export async function POST(request: Request) {
  try {
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
       AGENT
    ======================================================= */

    const agentSlug = cleanString(data.agentSlug);

    /* =======================================================
       PROPERTY
    ======================================================= */

    const propertyId = Number(data.propertyId);

    /* =======================================================
       VALIDATE NAME
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

    /* =======================================================
       VALIDATE EMAIL
    ======================================================= */

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

    /* =======================================================
       VALIDATE PHONE
    ======================================================= */

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

    /* =======================================================
       VALIDATE MESSAGE
    ======================================================= */

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

    /* =======================================================
       VALIDATE PROPERTY ID
    ======================================================= */

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
       VALIDATE AGENT SLUG
    ======================================================= */

    if (!agentSlug) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No agent was specified for this property.',
        },
        { status: 400 }
      );
    }

    if (agentSlug.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid agent.',
        },
        { status: 400 }
      );
    }

    /* =======================================================
       FIND ACTIVE AGENT

       IMPORTANT:

       We do NOT trust an email or agentId from
       the browser.

       The database determines the real Agent.
    ======================================================= */

    const agent = await prisma.agent.findFirst({
      where: {
        slug: agentSlug,
        isActive: true,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        profileImage: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected agent could not be found or is no longer active.',
        },
        { status: 404 }
      );
    }

    /* =======================================================
       VERIFY AGENT EMAIL
    ======================================================= */

    const agentEmail = cleanString(agent.email).toLowerCase();

    if (!agentEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected agent does not have a registered email address.',
        },
        { status: 400 }
      );
    }

    if (!emailPattern.test(agentEmail)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected agent has an invalid registered email address.',
        },
        { status: 400 }
      );
    }

    /* =======================================================
       FIND PROPERTY

       IMPORTANT:

       agentId is included here so we can verify that
       the selected property actually belongs to the
       selected Agent/Broker.
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
        image: true,
        agentId: true,
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
       VERIFY PROPERTY OWNERSHIP / ASSIGNMENT

       Admin assigns the property.

       The client cannot use another agent's slug to
       redirect an inquiry to a different agent.
    ======================================================= */

    if (property.agentId !== agent.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This property is not assigned to the selected agent.',
        },
        { status: 403 }
      );
    }

    /* =======================================================
       CREATE INQUIRY

       agentId comes ONLY from the verified database Agent.
    ======================================================= */

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        message,
        propertyId,
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
       RESEND CONFIGURATION
    ======================================================= */

    const resendApiKey = cleanString(
      process.env.RESEND_API_KEY
    );

    const fromEmail = cleanString(
      process.env.RESEND_FROM_EMAIL
    );

    /* =======================================================
       EMAIL CONFIGURATION CHECK
    ======================================================= */

    if (!resendApiKey) {
      console.error(
        'RESEND_API_KEY is not configured.'
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            'Inquiry was saved successfully, but email configuration is missing.',
          inquiry,
        },
        { status: 201 }
      );
    }

    if (!fromEmail) {
      console.error(
        'RESEND_FROM_EMAIL is not configured.'
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            'Inquiry was saved successfully, but the email sender is not configured.',
          inquiry,
        },
        { status: 201 }
      );
    }

    /* =======================================================
       ESCAPE HTML VALUES
    ======================================================= */

    const safeAgentName = escapeHtml(
      cleanString(agent.fullName)
    );

    const safeClientName = escapeHtml(name);
    const safeClientEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message);

    const safePropertyTitle = escapeHtml(
      cleanString(property.title)
    );

    const safePropertyLocation = escapeHtml(
      cleanString(property.location)
    );

    const safePropertyPrice = escapeHtml(
      String(property.price)
    );

    /* =======================================================
       SEND EMAIL

       Email goes to the Agent's registered email.

       Reply-To is the client's email.
    ======================================================= */

    try {
      const resend = new Resend(resendApiKey);

      const resendResult = await resend.emails.send({
        from: fromEmail,

        to: [agentEmail],

        replyTo: email,

        subject:
          `New Property Inquiry - ${property.title}`,

        text: `
NEW PROPERTY INQUIRY

====================

A client has submitted a new property inquiry.

PROPERTY

--------

Title: ${property.title}
Price: ₱${property.price}
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Property Inquiry</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f8fafc;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <div style="padding:30px 15px;">
    <div
      style="
        max-width:650px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:16px;
        overflow:hidden;
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:#020617;
          padding:30px;
        "
      >
        <h1
          style="
            margin:0;
            color:#ffffff;
            font-size:24px;
          "
        >
          New Property Inquiry
        </h1>

        <p
          style="
            margin:8px 0 0;
            color:#94a3b8;
            font-size:14px;
          "
        >
          BREA 88 REALTY
        </p>
      </div>

      <!-- CONTENT -->

      <div style="padding:30px;">

        <p
          style="
            margin:0 0 20px;
            color:#334155;
            font-size:15px;
            line-height:1.6;
          "
        >
          Hello ${safeAgentName},
        </p>

        <p
          style="
            margin:0 0 25px;
            color:#334155;
            font-size:15px;
            line-height:1.6;
          "
        >
          You have received a new property inquiry
          from a client.
        </p>

        <!-- PROPERTY -->

        <div
          style="
            margin-bottom:25px;
            padding:20px;
            background:#f8fafc;
            border-radius:12px;
            border:1px solid #e2e8f0;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:18px;
            "
          >
            Property
          </h2>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Title:</strong>
            ${safePropertyTitle}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Price:</strong>
            ₱${safePropertyPrice}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Location:</strong>
            ${safePropertyLocation}
          </p>

        </div>

        <!-- CLIENT -->

        <div
          style="
            margin-bottom:25px;
            padding:20px;
            background:#ffffff;
            border-radius:12px;
            border:1px solid #e2e8f0;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:18px;
            "
          >
            Client Information
          </h2>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Name:</strong>
            ${safeClientName}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Email:</strong>
            ${safeClientEmail}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Phone:</strong>
            ${safePhone}
          </p>

        </div>

        <!-- MESSAGE -->

        <div
          style="
            margin-bottom:25px;
            padding:20px;
            background:#f8fafc;
            border-radius:12px;
            border:1px solid #e2e8f0;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:18px;
            "
          >
            Message
          </h2>

          <p
            style="
              margin:0;
              color:#475569;
              font-size:14px;
              line-height:1.7;
              white-space:pre-wrap;
            "
          >
            ${safeMessage}
          </p>

        </div>

        <!-- INQUIRY -->

        <div
          style="
            margin-bottom:25px;
            padding:20px;
            background:#ffffff;
            border-radius:12px;
            border:1px solid #e2e8f0;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:18px;
            "
          >
            Inquiry Information
          </h2>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Inquiry ID:</strong>
            ${inquiry.id}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Status:</strong>
            ${escapeHtml(inquiry.status)}
          </p>

          <p
            style="
              margin:6px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Submitted:</strong>
            ${escapeHtml(
              inquiry.createdAt.toLocaleString()
            )}
          </p>

        </div>

        <p
          style="
            margin:0;
            color:#64748b;
            font-size:13px;
            line-height:1.6;
          "
        >
          You can reply directly to this email to
          contact the client.
        </p>

      </div>

      <!-- FOOTER -->

      <div
        style="
          padding:20px 30px;
          background:#f8fafc;
          border-top:1px solid #e2e8f0;
        "
      >

        <p
          style="
            margin:0;
            color:#64748b;
            font-size:12px;
            text-align:center;
          "
        >
          BREA 88 REALTY
          <br />
          Service with a Heart
        </p>

      </div>

    </div>
  </div>
</body>
</html>
        `,
      });

      if (resendResult.error) {
        console.error(
          'Resend inquiry email error:',
          resendResult.error
        );

        return NextResponse.json(
          {
            success: true,
            emailSent: false,
            message:
              'Inquiry was saved successfully, but the notification email could not be sent.',
            inquiry,
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          emailSent: true,
          message:
            'Inquiry submitted successfully.',
          inquiry,
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error(
        'Inquiry email sending failed:',
        emailError
      );

      /*
       * IMPORTANT:
       *
       * The inquiry has already been saved.
       *
       * An email failure must NOT delete the inquiry.
       */

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            'Inquiry was saved successfully, but the notification email could not be sent.',
          inquiry,
        },
        { status: 201 }
      );
    }
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
   PATCH INQUIRY

   Agents/Brokers can only update inquiries assigned
   to themselves.

   Supported statuses:

   New
   Read
   Contacted
   Viewing Scheduled
   Viewing Completed
   Follow Up
   Closed
   Cancelled
========================================================= */

export async function PATCH(request: Request) {
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

    const id = Number(data.id);
    const status = cleanString(data.status);

    if (
      !Number.isInteger(id) ||
      id <= 0
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
      'Read',
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
        },
        { status: 400 }
      );
    }

    /* =======================================================
       FIND INQUIRY

       The agentId condition is CRITICAL.

       An Agent/Broker cannot update another Agent's
       inquiry even if they know the inquiry ID.
    ======================================================= */

    const existingInquiry =
      await prisma.inquiry.findFirst({
        where: {
          id,
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

    const inquiry = await prisma.inquiry.update({
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
        message: 'Inquiry status updated successfully.',
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