import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';

const ALLOWED_STATUSES = new Set([
  'New',
  'Read',
  'Contacted',
  'Viewing Scheduled',
  'Viewing Completed',
  'Follow Up',
  'Closed',
  'Cancelled',
]);

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPhone(data: Record<string, unknown>): string {
  return cleanString(data.phone) || cleanString(data.contact_number);
}

function getMessage(data: Record<string, unknown>): string {
  const message = cleanString(data.message);
  const preferredLocation = cleanString(data.prefer_location);

  if (!preferredLocation) return message;

  return `${message}\n\nPreferred Location: ${preferredLocation}`.trim();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* =========================================================
   GET INQUIRIES

   Agent/Broker can only see inquiries routed to their
   own permanent profile link.
========================================================= */
export async function GET() {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in as an agent.' },
        { status: 401 }
      );
    }

    const inquiries = await prisma.inquiry.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ success: true, inquiries }, { status: 200 });
  } catch (error) {
    console.error('GET /api/inquiries error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load inquiries.',
        debug:
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST INQUIRY

   Public client sends:
   - name
   - email
   - phone OR contact_number
   - message
   - optional prefer_location
   - agentSlug
   - optional propertyId

   IMPORTANT:
   agentId is NEVER accepted from the browser.

   The permanent agent slug identifies the Agent/Broker.
   Property assignment is NOT used for routing.
========================================================= */
export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid inquiry data.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name = cleanString(data.name);
    const email = cleanString(data.email).toLowerCase();
    const phone = getPhone(data);
    const message = getMessage(data);
    const agentSlug = cleanString(data.agentSlug);

    const rawPropertyId = data.propertyId;
    let propertyId: number | null = null;

    if (
      rawPropertyId !== undefined &&
      rawPropertyId !== null &&
      cleanString(rawPropertyId) !== ''
    ) {
      const parsedPropertyId = Number(rawPropertyId);

      if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid property ID.' },
          { status: 400 }
        );
      }

      propertyId = parsedPropertyId;
    }

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid client name.' },
        { status: 400 }
      );
    }

    if (!email || email.length > 255 || !validEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 7 || phone.length > 30) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid phone number.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Inquiry message is required.' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Inquiry message is too long.' },
        { status: 400 }
      );
    }

    if (!agentSlug || agentSlug.length > 100) {
      return NextResponse.json(
        { success: false, message: 'No valid agent was specified.' },
        { status: 400 }
      );
    }

    /* =======================================================
       RESOLVE THE AGENT FROM THE PERMANENT PROFILE SLUG
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
          message: 'The selected agent could not be found or is no longer active.',
        },
        { status: 404 }
      );
    }

    const agentEmail = cleanString(agent.email).toLowerCase();

    if (!validEmail(agentEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: 'The selected agent does not have a valid email address.',
        },
        { status: 400 }
      );
    }

    /* =======================================================
       OPTIONAL PROPERTY

       If this inquiry came from a property, verify only that
       the property exists.

       DO NOT compare property.agentId with agent.id.
       That field is not used for inquiry routing anymore.
    ======================================================= */
    let property: {
      id: number;
      title: string;
      price: string;
      location: string;
      image: string;
    } | null = null;

    if (propertyId !== null) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
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
          { success: false, message: 'Property not found.' },
          { status: 404 }
        );
      }
    }

    /* =======================================================
       CREATE INQUIRY

       The resolved Agent ID is stored here. This is what
       makes the inquiry appear in that Agent/Broker inbox.
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
       EMAIL NOTIFICATION
    ======================================================= */
    const resendApiKey = cleanString(process.env.RESEND_API_KEY);
    const fromEmail = cleanString(process.env.RESEND_FROM_EMAIL);

    if (!resendApiKey || !fromEmail) {
      console.error('Resend email configuration is incomplete.');

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message: 'Inquiry was saved successfully.',
          inquiry,
        },
        { status: 201 }
      );
    }

    const safeAgentName = escapeHtml(agent.fullName);
    const safeClientName = escapeHtml(name);
    const safeClientEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

    const propertySection = property
      ? `
        <h3 style="margin:24px 0 8px;color:#0f172a;">Property</h3>
        <p style="margin:4px 0;"><strong>${escapeHtml(property.title)}</strong></p>
        <p style="margin:4px 0;">Price: ₱${escapeHtml(property.price)}</p>
        <p style="margin:4px 0;">Location: ${escapeHtml(property.location)}</p>
      `
      : `
        <h3 style="margin:24px 0 8px;color:#0f172a;">Inquiry Source</h3>
        <p style="margin:4px 0;">Agent/Broker profile inquiry</p>
      `;

    const textPropertySection = property
      ? `\nPROPERTY\nTitle: ${property.title}\nPrice: ₱${property.price}\nLocation: ${property.location}\n`
      : '\nINQUIRY SOURCE\nAgent/Broker profile inquiry\n';

    try {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: fromEmail,
        to: [agentEmail],
        replyTo: email,
        subject: property
          ? `New Property Inquiry - ${property.title}`
          : `New Inquiry - ${agent.fullName}`,
        text: `
NEW INQUIRY - BREA 88 REALTY

${textPropertySection}
CLIENT
Name: ${name}
Email: ${email}
Phone: ${phone}

MESSAGE
${message}

INQUIRY ID: ${inquiry.id}
STATUS: ${inquiry.status}
ROUTED TO: ${agent.fullName}

Reply directly to this email to contact the client.
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Inquiry - BREA 88 REALTY</title>
</head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
    <h1 style="margin:0 0 6px;color:#020617;font-size:24px;">New Inquiry</h1>
    <p style="margin:0;color:#64748b;">BREA 88 REALTY</p>

    <div style="margin-top:24px;padding:18px;background:#f8fafc;border-radius:12px;">
      <p style="margin:0 0 6px;"><strong>Routed to:</strong> ${safeAgentName}</p>
      <p style="margin:0;"><strong>Inquiry ID:</strong> ${inquiry.id}</p>
    </div>

    ${propertySection}

    <h3 style="margin:24px 0 8px;color:#0f172a;">Client</h3>
    <p style="margin:4px 0;"><strong>${safeClientName}</strong></p>
    <p style="margin:4px 0;">Email: ${safeClientEmail}</p>
    <p style="margin:4px 0;">Phone: ${safePhone}</p>

    <h3 style="margin:24px 0 8px;color:#0f172a;">Message</h3>
    <div style="padding:16px;background:#f8fafc;border-radius:12px;line-height:1.6;">
      ${safeMessage}
    </div>

    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">
      You can reply directly to this email to contact the client.
    </p>
  </div>
</body>
</html>
        `.trim(),
      });

      return NextResponse.json(
        {
          success: true,
          emailSent: true,
          message: 'Inquiry sent successfully.',
          inquiry,
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error('POST /api/inquiries email error:', emailError);

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message: 'Inquiry was saved successfully, but the email notification could not be sent.',
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
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH INQUIRY STATUS

   Agent/Broker can update only inquiries routed to their
   own account.
========================================================= */
export async function PATCH(request: Request) {
  try {
    const agent = await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in as an agent.' },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid inquiry update.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const inquiryId = Number(data.id);
    const status = cleanString(data.status);

    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid inquiry ID.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inquiry status.' },
        { status: 400 }
      );
    }

    const existingInquiry = await prisma.inquiry.findFirst({
      where: {
        id: inquiryId,
        agentId: agent.id,
      },
      select: { id: true },
    });

    if (!existingInquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found.' },
        { status: 404 }
      );
    }

    const inquiry = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status },
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
      { success: true, inquiry },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/inquiries error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update inquiry.',
        debug:
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
