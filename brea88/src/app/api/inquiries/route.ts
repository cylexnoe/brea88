import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';
import twilio from 'twilio';

// =========================================================
// PHONE NUMBER HELPER
// =========================================================
//
// Converts common Philippine phone formats into E.164.
//
// Examples:
//
// 09171234567     -> +639171234567
// 639171234567    -> +639171234567
// +639171234567   -> +639171234567
//
// This is used ONLY for the Agent's registered phone number.
// The client cannot choose the SMS recipient.
// =========================================================

function normalizePhoneNumber(value: string): string {
  const phone = value.trim();

  if (!phone) {
    return '';
  }

  // Philippine mobile number
  // 09171234567 -> +639171234567
  if (/^09\d{9}$/.test(phone)) {
    return `+63${phone.slice(1)}`;
  }

  // Philippine number without +
  // 639171234567 -> +639171234567
  if (/^63\d{10}$/.test(phone)) {
    return `+${phone}`;
  }

  // Already international
  // +639171234567
  if (/^\+\d{10,15}$/.test(phone)) {
    return phone;
  }

  // Remove spaces, hyphens and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (/^\+\d{10,15}$/.test(cleaned)) {
    return cleaned;
  }

  return '';
}

// =========================================================
// GENERAL HELPERS
// =========================================================

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

// =========================================================
// EMAIL VALIDATION
// =========================================================

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =========================================================
// GET INQUIRIES
// =========================================================
//
// Only logged-in Agents/Brokers can view inquiries.
//
// Each Agent/Broker can only see inquiries whose agentId
// matches their own account.
//
// =========================================================

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

// =========================================================
// POST INQUIRY
// =========================================================
//
// Public client submits:
//
// - name
// - email
// - phone
// - message
// - propertyId (optional)
// - agentSlug
//
// IMPORTANT:
//
// The browser does NOT send:
//
// - agentId
// - agent email
// - agent phone
//
// The server resolves the Agent from the permanent
// agentSlug.
//
// =========================================================
//
// FLOW:
//
// Client
//   ↓
// Permanent Agent Link
//   ↓
// agentSlug
//   ↓
// POST /api/inquiries
//   ↓
// Find active Agent
//   ↓
// Create Inquiry
//   ↓
// ┌───────────────┬────────────────┐
// │               │                │
// ▼               ▼                │
// Agent Email   Agent SMS          │
// agent.email   agent.phone        │
//                                  │
// └───────────────┴────────────────┘
//
// Email/SMS failures do NOT delete the inquiry.
//
// =========================================================

export async function POST(request: Request) {
  try {
    // =======================================================
    // READ REQUEST BODY
    // =======================================================

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

    // =======================================================
    // CLIENT INFORMATION
    // =======================================================

    const name = cleanString(data.name);
    const email = cleanString(data.email).toLowerCase();
    const phone = cleanString(data.phone);
    const message = cleanString(data.message);

    // =======================================================
    // AGENT
    // =======================================================

    const agentSlug = cleanString(data.agentSlug);

    // =======================================================
    // PROPERTY
    // =======================================================

    let propertyId: number | null = null;

    if (
      data.propertyId !== undefined &&
      data.propertyId !== null &&
      String(data.propertyId).trim() !== ''
    ) {
      const parsedPropertyId = Number(data.propertyId);

      if (
        !Number.isInteger(parsedPropertyId) ||
        parsedPropertyId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid property ID.',
          },
          { status: 400 }
        );
      }

      propertyId = parsedPropertyId;
    }

    // =======================================================
    // VALIDATE NAME
    // =======================================================

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

    // =======================================================
    // VALIDATE EMAIL
    // =======================================================

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client email is required.',
        },
        { status: 400 }
      );
    }

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

    // =======================================================
    // VALIDATE PHONE
    // =======================================================

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

    // =======================================================
    // VALIDATE MESSAGE
    // =======================================================

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

    // =======================================================
    // VALIDATE AGENT SLUG
    // =======================================================

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

    // =======================================================
    // FIND ACTIVE AGENT
    // =======================================================
    //
    // IMPORTANT SECURITY RULE:
    //
    // We do NOT trust agentId, email or phone from the
    // browser.
    //
    // The permanent agentSlug determines the real Agent.
    //
    // =======================================================

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

    // =======================================================
    // VERIFY AGENT EMAIL
    // =======================================================

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

    // =======================================================
    // FIND PROPERTY
    // =======================================================
    //
    // IMPORTANT:
    //
    // We ONLY verify that the property exists.
    //
    // We do NOT verify property.agentId.
    //
    // This follows your business rule:
    //
    // "Admin does not assign or reassign properties."
    //
    // The permanent Agent Profile link determines which
    // Agent receives the inquiry.
    //
    // =======================================================

    let property: {
      id: number;
      title: string;
      location: string;
      price: string;
    } | null = null;

    if (propertyId !== null) {
      property = await prisma.property.findUnique({
        where: {
          id: propertyId,
        },

        select: {
          id: true,
          title: true,
          location: true,
          price: true,
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
    }

    // =======================================================
    // CREATE INQUIRY
    // =======================================================
    //
    // agentId comes ONLY from the verified Agent record.
    //
    // =======================================================

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

    // =======================================================
    // NOTIFICATION RESULTS
    // =======================================================

    let smsSent = false;
    let emailSent = false;

    // =======================================================
    // TWILIO CONFIGURATION
    // =======================================================

    const twilioAccountSid = cleanString(
      process.env.TWILIO_ACCOUNT_SID
    );

    const twilioAuthToken = cleanString(
      process.env.TWILIO_AUTH_TOKEN
    );

    const twilioPhoneNumber = cleanString(
      process.env.TWILIO_PHONE_NUMBER
    );

    // =======================================================
    // AGENT PHONE
    // =======================================================
    //
    // This comes from the Agent database record.
    //
    // Example:
    //
    // Agent.phone = 09171234567
    //
    // becomes:
    //
    // +639171234567
    //
    // =======================================================

    const agentPhone = agent.phone
      ? normalizePhoneNumber(agent.phone)
      : '';

    // =======================================================
    // SEND SMS
    // =======================================================
    //
    // SMS failure does NOT cancel the inquiry.
    //
    // =======================================================

    if (
      twilioAccountSid &&
      twilioAuthToken &&
      twilioPhoneNumber &&
      agentPhone
    ) {
      try {
        const twilioClient = twilio(
          twilioAccountSid,
          twilioAuthToken
        );

        const smsMessage = property
          ? `BREA 88 REALTY: New inquiry from ${name} about "${property.title}". Contact: ${phone}. Inquiry #${inquiry.id}. Check your Agent Dashboard.`
          : `BREA 88 REALTY: New client inquiry from ${name}. Contact: ${phone}. Inquiry #${inquiry.id}. Check your Agent Dashboard.`;

        await twilioClient.messages.create({
          body: smsMessage,
          from: twilioPhoneNumber,
          to: agentPhone,
        });

        smsSent = true;

        console.log(
          `Inquiry SMS sent successfully to Agent ${agent.id}`
        );
      } catch (smsError) {
        console.error(
          'Inquiry SMS sending failed:',
          smsError
        );
      }
    } else {
      if (!twilioAccountSid) {
        console.error(
          'TWILIO_ACCOUNT_SID is not configured.'
        );
      }

      if (!twilioAuthToken) {
        console.error(
          'TWILIO_AUTH_TOKEN is not configured.'
        );
      }

      if (!twilioPhoneNumber) {
        console.error(
          'TWILIO_PHONE_NUMBER is not configured.'
        );
      }

      if (!agentPhone) {
        console.error(
          `Agent ${agent.id} does not have a valid registered phone number.`
        );
      }
    }

    // =======================================================
    // RESEND CONFIGURATION
    // =======================================================

    const resendApiKey = cleanString(
      process.env.RESEND_API_KEY
    );

    const fromEmail = cleanString(
      process.env.RESEND_FROM_EMAIL
    );

    // =======================================================
    // ESCAPE HTML VALUES
    // =======================================================

    const safeAgentName = escapeHtml(
      cleanString(agent.fullName)
    );

    const safeClientName = escapeHtml(name);

    const safeClientEmail = escapeHtml(email);

    const safePhone = escapeHtml(phone);

    const safeMessage = escapeHtml(message);

    const safePropertyTitle = escapeHtml(
      property
        ? cleanString(property.title)
        : 'No specific property'
    );

    const safePropertyLocation = escapeHtml(
      property
        ? cleanString(property.location)
        : 'Agent Profile Inquiry'
    );

    const safePropertyPrice = escapeHtml(
      property
        ? cleanString(property.price)
        : 'N/A'
    );

    // =======================================================
    // SEND EMAIL
    // =======================================================
    //
    // Email goes to the Agent's registered email.
    //
    // Reply-To goes to the client's email.
    //
    // Email failure does NOT cancel the inquiry.
    //
    // =======================================================

    if (!resendApiKey) {
      console.error(
        'RESEND_API_KEY is not configured.'
      );
    } else if (!fromEmail) {
      console.error(
        'RESEND_FROM_EMAIL is not configured.'
      );
    } else {
      try {
        const resend = new Resend(resendApiKey);

        const resendResult = await resend.emails.send({
          from: fromEmail,

          to: [agentEmail],

          replyTo: email,

          subject: property
            ? `New Property Inquiry - ${property.title}`
            : `New Client Inquiry - ${agent.fullName}`,

          // =================================================
          // PLAIN TEXT EMAIL
          // =================================================

          text: `
NEW PROPERTY INQUIRY
====================

A client has submitted a new inquiry.

PROPERTY
--------

Title: ${
            property
              ? property.title
              : 'No specific property'
          }

Price: ${
            property
              ? `₱${property.price}`
              : 'N/A'
          }

Location: ${
            property
              ? property.location
              : 'Agent Profile Inquiry'
          }

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

          // =================================================
          // HTML EMAIL
          // =================================================

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
        } else {
          emailSent = true;

          console.log(
            `Inquiry email sent successfully to Agent ${agent.id}`
          );
        }
      } catch (emailError) {
        console.error(
          'Inquiry email sending failed:',
          emailError
        );
      }
    }

    // =======================================================
    // FINAL RESPONSE
    // =======================================================
    //
    // IMPORTANT:
    //
    // The inquiry was already saved.
    //
    // Email and SMS failures do NOT cause the inquiry
    // to be deleted.
    //
    // =======================================================

    let notificationMessage =
      'Inquiry submitted successfully.';

    if (emailSent && smsSent) {
      notificationMessage =
        'Inquiry submitted successfully. Email and SMS notifications were sent.';
    } else if (emailSent && !smsSent) {
      notificationMessage =
        'Inquiry submitted successfully. Email notification was sent, but SMS notification could not be sent.';
    } else if (!emailSent && smsSent) {
      notificationMessage =
        'Inquiry submitted successfully. SMS notification was sent, but email notification could not be sent.';
    } else {
      notificationMessage =
        'Inquiry was saved successfully, but email and SMS notifications could not be sent.';
    }

    return NextResponse.json(
      {
        success: true,
        emailSent,
        smsSent,
        message: notificationMessage,
        inquiry,
      },
      { status: 201 }
    );
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

// =========================================================
// PATCH INQUIRY
// =========================================================
//
// Agents/Brokers can only update inquiries belonging
// to their own account.
//
// =========================================================

export async function PATCH(request: Request) {
  try {
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

    // =======================================================
    // READ REQUEST BODY
    // =======================================================

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

    // =======================================================
    // VALIDATE ID
    // =======================================================

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid inquiry ID.',
        },
        { status: 400 }
      );
    }

    // =======================================================
    // ALLOWED STATUSES
    // =======================================================

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

    // =======================================================
    // FIND INQUIRY
    // =======================================================
    //
    // CRITICAL SECURITY CHECK:
    //
    // The inquiry must belong to the currently logged-in
    // Agent/Broker.
    //
    // Agent A cannot update Agent B's inquiry.
    //
    // =======================================================

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

    // =======================================================
    // UPDATE STATUS
    // =======================================================

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

// =========================================================
// DELETE INQUIRY
// =========================================================
//
// Agents/Brokers can only delete inquiries belonging
// to their own account.
//
// =========================================================

export async function DELETE(request: Request) {
  try {
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

    // =======================================================
    // READ REQUEST BODY
    // =======================================================

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

    // =======================================================
    // VALIDATE ID
    // =======================================================

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid inquiry ID.',
        },
        { status: 400 }
      );
    }

    // =======================================================
    // FIND INQUIRY
    // =======================================================
    //
    // CRITICAL SECURITY CHECK:
    //
    // Agent A cannot delete Agent B's inquiry.
    //
    // =======================================================

    const existingInquiry =
      await prisma.inquiry.findFirst({
        where: {
          id,
          agentId: agent.id,
        },

        select: {
          id: true,
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

    // =======================================================
    // DELETE
    // =======================================================

    await prisma.inquiry.delete({
      where: {
        id: existingInquiry.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry deleted successfully.',
        inquiryId: existingInquiry.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE /api/inquiries error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete inquiry.',

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