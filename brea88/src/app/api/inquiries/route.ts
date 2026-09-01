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

/* Escape HTML so client-submitted values cannot inject HTML
   into the email. */
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

   NORMAL CLIENTS DO NOT NEED TO LOG IN.

   The client sends:

   - name
   - email
   - phone
   - message
   - propertyId
   - agentSlug

   The client NEVER sends:

   - agentId
   - agent.email

   The server uses agentSlug to find the registered Agent
   in the database.

   Then:

   Agent.email
        ↓
   Resend recipient

   Example:

   agentSlug = "john-doe"

   Database:

   Agent {
      id: 5
      slug: "john-doe"
      email: "john@gmail.com"
   }

   Result:

   Inquiry saved with agentId = 5

   Email sent to:
   john@gmail.com
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
       AGENT SLUG
    ======================================================= */

    const agentSlug = cleanString(data.agentSlug);

    /* =======================================================
       PROPERTY ID
    ======================================================= */

    const propertyId = Number(data.propertyId);

    /* =======================================================
       VALIDATE CLIENT NAME
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
       VALIDATE CLIENT EMAIL
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
            'No agent was specified for this inquiry.',
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

       We DO NOT trust an email from the client.

       We only accept agentSlug.

       The server gets the actual email from PostgreSQL.
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
        image: true,
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

       agentId comes from the database lookup.

       NOT from the browser.

       This means the client cannot simply submit:

       agentId: 123

       and redirect an inquiry to another agent.
    ======================================================= */

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        message,
        propertyId,

        // Agent comes from the verified database record.
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

       IMPORTANT:

       Resend is initialized HERE instead of globally.

       This prevents Vercel from trying to construct:

       new Resend(undefined)

       during the build process.
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
       ESCAPE VALUES FOR HTML EMAIL
    ======================================================= */

    const safeAgentName = escapeHtml(agent.fullName);

    const safeClientName = escapeHtml(name);

    const safeClientEmail = escapeHtml(email);

    const safePhone = escapeHtml(phone);

    const safeMessage = escapeHtml(message);

    const safePropertyTitle = escapeHtml(
      property.title
    );

    const safePropertyLocation = escapeHtml(
      property.location
    );

    const safePropertyPrice = escapeHtml(
      property.price
    );

    /* =======================================================
       SEND EMAIL TO AGENT

       Recipient:

       agent.email

       NOT:

       client email

       NOT:

       agent email from browser

       The recipient is taken directly from the
       authenticated/verified database record.
    ======================================================= */

    try {
      const resend = new Resend(resendApiKey);

      const resendResult = await resend.emails.send({
        from: fromEmail,

        // THIS IS THE IMPORTANT PART
        to: [agentEmail],

        // When the agent clicks Reply,
        // the reply goes to the client.
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
          BREA 88 Realty
        </p>

      </div>

      <!-- CONTENT -->

      <div style="padding:30px;">

        <p
          style="
            margin:0 0 15px;
            color:#334155;
            font-size:16px;
            line-height:1.6;
          "
        >
          Hello
          <strong>${safeAgentName}</strong>,
        </p>

        <p
          style="
            color:#475569;
            font-size:15px;
            line-height:1.6;
          "
        >
          A client has submitted a new inquiry
          about a property.
        </p>

        <!-- PROPERTY -->

        <div
          style="
            margin-top:25px;
            padding:20px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:12px;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:16px;
            "
          >
            Property Details
          </h2>

          <p
            style="
              margin:8px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Property:</strong>
            ${safePropertyTitle}
          </p>

          <p
            style="
              margin:8px 0;
              color:#475569;
              font-size:14px;
            "
          >
            <strong>Price:</strong>
            ₱${safePropertyPrice}
          </p>

          <p
            style="
              margin:8px 0;
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
            margin-top:20px;
            padding:20px;
            background:#eff6ff;
            border:1px solid #bfdbfe;
            border-radius:12px;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#1e3a8a;
              font-size:16px;
            "
          >
            Client Information
          </h2>

          <p
            style="
              margin:8px 0;
              color:#334155;
              font-size:14px;
            "
          >
            <strong>Name:</strong>
            ${safeClientName}
          </p>

          <p
            style="
              margin:8px 0;
              color:#334155;
              font-size:14px;
            "
          >
            <strong>Email:</strong>
            <a
              href="mailto:${encodeURIComponent(email)}"
              style="color:#1d4ed8;"
            >
              ${safeClientEmail}
            </a>
          </p>

          <p
            style="
              margin:8px 0;
              color:#334155;
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
            margin-top:20px;
            padding:20px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:12px;
          "
        >

          <h2
            style="
              margin:0 0 15px;
              color:#0f172a;
              font-size:16px;
            "
          >
            Client Message
          </h2>

          <p
            style="
              margin:0;
              color:#475569;
              font-size:14px;
              line-height:1.7;
              white-space:pre-line;
            "
          >
            ${safeMessage}
          </p>

        </div>

        <!-- REPLY BUTTON -->

        <div
          style="
            margin-top:25px;
            text-align:center;
          "
        >

          <a
            href="mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
              `Re: Property Inquiry - ${property.title}`
            )}"
            style="
              display:inline-block;
              padding:13px 22px;
              background:#1e3a8a;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:bold;
            "
          >
            Reply to Client
          </a>

        </div>

        <!-- FOOTER -->

        <div
          style="
            margin-top:30px;
            padding-top:20px;
            border-top:1px solid #e2e8f0;
          "
        >

          <p
            style="
              margin:0;
              color:#94a3b8;
              font-size:12px;
              line-height:1.6;
            "
          >
            Inquiry ID: ${inquiry.id}
            <br />

            Status: ${escapeHtml(inquiry.status)}
            <br />

            Submitted:
            ${escapeHtml(
              inquiry.createdAt.toLocaleString()
            )}
          </p>

          <p
            style="
              margin:15px 0 0;
              color:#0f172a;
              font-size:13px;
              font-weight:bold;
            "
          >
            BREA 88 REALTY
          </p>

          <p
            style="
              margin:3px 0 0;
              color:#64748b;
              font-size:12px;
            "
          >
            Service with a Heart
          </p>

        </div>

      </div>

    </div>

  </div>

</body>
</html>
        `.trim(),
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
            'Inquiry submitted successfully and sent to the assigned agent.',
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

   - Only logged-in agents can update inquiries.
   - Agents can update only their own inquiries.
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
       VALIDATE INQUIRY ID
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

    /* =======================================================
       ALLOWED STATUSES
    ======================================================= */

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

       BOTH:

       id
       +
       agentId

       are checked.

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

