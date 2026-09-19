import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';
import twilio from 'twilio';
import { sendInquiryPushNotification } from '@/lib/push-notifications';

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePhoneNumber(value: string): string {
  const phone = value.trim();

  if (/^09\d{9}$/.test(phone)) {
    return `+63${phone.slice(1)}`;
  }

  if (/^63\d{10}$/.test(phone)) {
    return `+${phone}`;
  }

  if (/^\+\d{10,15}$/.test(phone)) {
    return phone;
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');

  return /^\+\d{10,15}$/.test(cleaned)
    ? cleaned
    : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function parsePreferredViewingDate(
  value: unknown,
): Date | null | 'invalid' {
  const raw = cleanString(value);

  if (!raw) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return 'invalid';
  }

  const [year, month, day] = raw
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return 'invalid';
  }

  const today = new Date();

  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  if (date.getTime() < todayUtc) {
    return 'invalid';
  }

  return date;
}

function formatViewingDate(
  date: Date | null,
): string {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    },
  );
}

const inquiryInclude = {
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
};

/* ============================================================
 * GET INQUIRIES
 * ============================================================ */

export async function GET() {
  try {
    const agent =
      await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Please log in as an agent.',
        },
        {
          status: 401,
        },
      );
    }

    const inquiries =
      await prisma.inquiry.findMany({
        where: {
          agentId: agent.id,
        },

        orderBy: {
          createdAt: 'desc',
        },

        include: inquiryInclude,
      });

    return NextResponse.json({
      success: true,
      inquiries,
    });
  } catch (error) {
    console.error(
      'GET /api/inquiries error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load inquiries.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * POST INQUIRY / SITE VIEWING REQUEST
 * ============================================================ */

export async function POST(
  request: Request,
) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request body.',
        },
        {
          status: 400,
        },
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
          message:
            'Invalid inquiry data.',
        },
        {
          status: 400,
        },
      );
    }

    const data =
      body as Record<string, unknown>;

    const name = cleanString(
      data.name,
    );

    const email = cleanString(
      data.email,
    ).toLowerCase();

    const phone = cleanString(
      data.phone,
    );

    const agentSlug = cleanString(
      data.agentSlug,
    );

    const suppliedMessage =
      cleanString(data.message);

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid name.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !email ||
      email.length > 255 ||
      !emailPattern.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid email address.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      phone.length < 7 ||
      phone.length > 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid phone number.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !agentSlug ||
      agentSlug.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid agent.',
        },
        {
          status: 400,
        },
      );
    }

    /* ========================================================
     * PROPERTY ID
     * ======================================================== */

    let propertyId: number | null = null;

    if (
      data.propertyId !== undefined &&
      data.propertyId !== null &&
      String(data.propertyId).trim() !== ''
    ) {
      const parsed = Number(
        data.propertyId,
      );

      if (
        !Number.isInteger(parsed) ||
        parsed <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid property ID.',
          },
          {
            status: 400,
          },
        );
      }

      propertyId = parsed;
    }

    /* ========================================================
     * VIEWING DATE
     * ======================================================== */

    const preferredViewingDate =
      parsePreferredViewingDate(
        data.preferredViewingDate,
      );

    if (
      preferredViewingDate ===
      'invalid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please choose a valid site viewing date that is today or later.',
        },
        {
          status: 400,
        },
      );
    }

    /* ========================================================
     * AGENT
     * ======================================================== */

    const agent =
      await prisma.agent.findFirst({
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
        {
          status: 404,
        },
      );
    }

    const agentEmail = cleanString(
      agent.email,
    ).toLowerCase();

    if (
      !emailPattern.test(agentEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected agent has an invalid registered email address.',
        },
        {
          status: 400,
        },
      );
    }

    /* ========================================================
     * PROPERTY
     * ======================================================== */

    let property: {
      id: number;
      title: string;
      location: string;
      price: string;
    } | null = null;

    if (propertyId !== null) {
      property =
        await prisma.property.findUnique({
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
            message:
              'Property not found.',
          },
          {
            status: 404,
          },
        );
      }
    }

    /* ========================================================
     * DETERMINE REQUEST TYPE
     * ======================================================== */

    const isSiteViewing =
      preferredViewingDate instanceof Date;

    const message = isSiteViewing
      ? `Site Viewing Request

Preferred Date: ${formatViewingDate(
          preferredViewingDate,
        )}

The client would like to schedule a site viewing for ${
          property?.title ??
          'this property'
        }.

Client Message:
${
  suppliedMessage ||
  'No additional message provided.'
}`
      : suppliedMessage;

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Inquiry message is required.',
        },
        {
          status: 400,
        },
      );
    }

    /* ========================================================
     * SAVE INQUIRY FIRST
     * ======================================================== */

    const inquiry =
      await prisma.inquiry.create({
        data: {
          name,
          email,
          phone,
          message,
          propertyId,
          agentId: agent.id,
          preferredViewingDate:
            isSiteViewing
              ? preferredViewingDate
              : null,
          status: 'New',
        },

        include: inquiryInclude,
      });

    /* ========================================================
     * PUSH NOTIFICATION
     * ======================================================== */

    let pushSent = 0;

    try {
      const pushResult =
        await sendInquiryPushNotification(
          agent.id,
          {
            inquiryId: inquiry.id,
            clientName: name,
            propertyTitle:
              property?.title ?? null,
            isViewingRequest:
              isSiteViewing,
          },
        );

      pushSent = pushResult.sent;
    } catch (pushError) {
      console.error(
        'Inquiry push notification failed:',
        pushError,
      );
    }

    /* ========================================================
     * SMS NOTIFICATION TO AGENT
     * ======================================================== */

    let smsSent = false;

    const agentPhone = agent.phone
      ? normalizePhoneNumber(
          agent.phone,
        )
      : '';

    const twilioAccountSid =
      cleanString(
        process.env.TWILIO_ACCOUNT_SID,
      );

    const twilioAuthToken =
      cleanString(
        process.env.TWILIO_AUTH_TOKEN,
      );

    const twilioPhoneNumber =
      cleanString(
        process.env.TWILIO_PHONE_NUMBER,
      );

    if (
      twilioAccountSid &&
      twilioAuthToken &&
      twilioPhoneNumber &&
      agentPhone
    ) {
      try {
        const twilioClient =
          twilio(
            twilioAccountSid,
            twilioAuthToken,
          );

        const smsMessage =
          isSiteViewing
            ? `BREA 88 REALTY: New site viewing request from ${name} for "${property?.title ?? 'a property'}". Preferred date: ${formatViewingDate(
                preferredViewingDate,
              )}. Contact: ${phone}. Inquiry #${inquiry.id}.`
            : property
              ? `BREA 88 REALTY: New inquiry from ${name} about "${property.title}". Contact: ${phone}. Inquiry #${inquiry.id}.`
              : `BREA 88 REALTY: New client inquiry from ${name}. Contact: ${phone}. Inquiry #${inquiry.id}.`;

        await twilioClient.messages.create(
          {
            body: smsMessage,
            from: twilioPhoneNumber,
            to: agentPhone,
          },
        );

        smsSent = true;
      } catch (error) {
        console.error(
          'Inquiry SMS sending failed:',
          error,
        );
      }
    }

    /* ========================================================
     * RESEND EMAILS
     *
     * EMAIL #1
     * Agent notification
     *
     * EMAIL #2
     * Client confirmation
     * ======================================================== */

    let emailSent = false;
    let clientEmailSent = false;

    const resendApiKey =
      cleanString(
        process.env.RESEND_API_KEY,
      );

    const fromEmail =
      cleanString(
        process.env.RESEND_FROM_EMAIL,
      );

    if (
      resendApiKey &&
      fromEmail
    ) {
      try {
        const resend =
          new Resend(
            resendApiKey,
          );

        /* ======================================================
         * SAFE VALUES
         * ====================================================== */

        const safeAgentName =
          escapeHtml(
            agent.fullName,
          );

        const safeClientName =
          escapeHtml(name);

        const safeClientEmail =
          escapeHtml(email);

        const safePhone =
          escapeHtml(phone);

        const safeMessage =
          escapeHtml(message);

        const safePropertyTitle =
          escapeHtml(
            property?.title ??
              'No specific property',
          );

        const safePropertyLocation =
          escapeHtml(
            property?.location ??
              'Agent Profile Inquiry',
          );

        const safePropertyPrice =
          escapeHtml(
            property?.price ?? 'N/A',
          );

        const formattedViewingDate =
          isSiteViewing
            ? formatViewingDate(
                preferredViewingDate,
              )
            : '';

        /* ======================================================
         * AGENT EMAIL
         * ====================================================== */

        const agentViewingText =
          isSiteViewing
            ? `
PREFERRED SITE VIEWING DATE
---------------------------
${formattedViewingDate}

This is a preferred date and is not yet confirmed.
Please contact the client to confirm availability.
`
            : '';

        const agentEmailResult =
          await resend.emails.send(
            {
              from: fromEmail,

              to: [agentEmail],

              replyTo: email,

              subject: isSiteViewing
                ? `Site Viewing Request - ${
                    property?.title ??
                    'Property'
                  }`
                : property
                  ? `New Property Inquiry - ${property.title}`
                  : `New Client Inquiry - ${agent.fullName}`,

              text: `NEW ${
                isSiteViewing
                  ? 'SITE VIEWING REQUEST'
                  : 'PROPERTY INQUIRY'
              }

PROPERTY
Title: ${
                property?.title ??
                'No specific property'
              }
Price: ${
                property
                  ? `₱${property.price}`
                  : 'N/A'
              }
Location: ${
                property?.location ??
                'Agent Profile Inquiry'
              }

CLIENT
Name: ${name}
Email: ${email}
Phone: ${phone}
${agentViewingText}
MESSAGE
${message}

Inquiry ID: ${inquiry.id}
Status: ${inquiry.status}
Submitted: ${inquiry.createdAt.toLocaleString()}

BREA 88 REALTY
Service with a Heart`,

              html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:30px">
  <div style="max-width:650px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">

    <div style="background:#071936;padding:28px;color:#fff">
      <h1 style="margin:0;font-size:24px">
        ${
          isSiteViewing
            ? 'Site Viewing Request'
            : 'New Property Inquiry'
        }
      </h1>

      <p style="margin:8px 0 0;color:#ead9b8">
        BREA 88 REALTY
      </p>
    </div>

    <div style="padding:30px">

      <p>
        Hello ${safeAgentName},
      </p>

      <p>
        You have received a new ${
          isSiteViewing
            ? 'site viewing request'
            : 'property inquiry'
        }.
      </p>

      <div style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="margin-top:0">
          Property
        </h2>

        <p>
          <strong>Title:</strong>
          ${safePropertyTitle}
        </p>

        <p>
          <strong>Price:</strong>
          ₱${safePropertyPrice}
        </p>

        <p>
          <strong>Location:</strong>
          ${safePropertyLocation}
        </p>
      </div>

      <div style="margin-top:18px;padding:18px;border:1px solid #e2e8f0;border-radius:12px">

        <h2 style="margin-top:0">
          Client Information
        </h2>

        <p>
          <strong>Name:</strong>
          ${safeClientName}
        </p>

        <p>
          <strong>Email:</strong>
          ${safeClientEmail}
        </p>

        <p>
          <strong>Phone:</strong>
          ${safePhone}
        </p>

      </div>

      ${
        isSiteViewing
          ? `
      <div style="margin-top:18px;padding:18px;background:#faf7ef;border:1px solid #ead9b8;border-radius:12px">

        <h2 style="margin-top:0">
          Preferred Site Viewing Date
        </h2>

        <p style="font-size:18px;font-weight:bold">
          ${escapeHtml(
            formattedViewingDate,
          )}
        </p>

        <p>
          This is a preferred date,
          not a confirmed appointment.
        </p>

      </div>
      `
          : ''
      }

      <div style="margin-top:18px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">

        <h2 style="margin-top:0">
          Message
        </h2>

        <p style="white-space:pre-wrap;line-height:1.7">
          ${safeMessage}
        </p>

      </div>

      <p style="color:#64748b;font-size:13px;margin-top:24px">
        You can reply directly to this email to contact the client.
      </p>

    </div>

    <div style="padding:20px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px">
      BREA 88 REALTY<br/>
      Service with a Heart
    </div>

  </div>
</div>
`,
            },
          );

        if (!agentEmailResult.error) {
          emailSent = true;
        } else {
          console.error(
            'Resend agent inquiry email error:',
            agentEmailResult.error,
          );
        }

        /* ======================================================
         * CLIENT CONFIRMATION EMAIL
         * ====================================================== */

        const clientEmailResult =
          await resend.emails.send(
            {
              from: fromEmail,

              to: [email],

              replyTo: agentEmail,

              subject: isSiteViewing
                ? `BREA 88 Realty - Site Viewing Request Received`
                : `BREA 88 Realty - Inquiry Received`,

              text: `BREA 88 REALTY
Service with a Heart

Hello ${name},

Thank you for contacting BREA 88 REALTY OPC.

We have successfully received your ${
                isSiteViewing
                  ? 'site viewing request'
                  : 'property inquiry'
              }.

PROPERTY
${
  property?.title ??
  'General Property Inquiry'
}

Location:
${
  property?.location ??
  'Not specified'
}

${
  property
    ? `Price:
₱${property.price}

`
    : ''
}${
  isSiteViewing
    ? `PREFERRED SITE VIEWING DATE
${formattedViewingDate}

Please note that this is a preferred date and is not yet a confirmed appointment.

`
    : ''
}YOUR MESSAGE
${suppliedMessage || 'No additional message provided.'}

REFERENCE
Inquiry #${inquiry.id}

Our team has received your request and ${
                isSiteViewing
                  ? 'will contact you to confirm the viewing schedule.'
                  : 'will get in touch with you regarding your inquiry.'
              }

Assigned ${
                agent.role
              }:
${agent.fullName}

You may reply to this email if you need to provide additional information.

Thank you for choosing BREA 88 REALTY OPC.

Service with a Heart,
Building Trust from the Start.

BREA 88 REALTY OPC
`,
              html: `
<div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif">

  <div style="padding:40px 16px">

    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;box-shadow:0 12px 35px rgba(15,23,42,0.08)">

      <!-- HEADER -->

      <div style="background:#071936;padding:36px 30px;text-align:center">

        <div style="font-size:13px;letter-spacing:3px;font-weight:bold;color:#ead9b8;text-transform:uppercase">
          BREA 88 REALTY OPC
        </div>

        <div style="margin-top:10px;font-size:14px;color:#ffffff">
          Service with a Heart
        </div>

      </div>

      <!-- MAIN -->

      <div style="padding:38px 30px">

        <p style="margin:0;color:#0f172a;font-size:25px;font-weight:700">
          Thank You, ${safeClientName}!
        </p>

        <p style="margin:14px 0 0;color:#475569;font-size:15px;line-height:1.7">
          We have successfully received your
          ${
            isSiteViewing
              ? 'site viewing request'
              : 'property inquiry'
          }.
        </p>

        <!-- SUCCESS MESSAGE -->

        <div style="margin-top:26px;padding:20px;background:#faf7ef;border:1px solid #ead9b8;border-radius:15px">

          <div style="font-size:13px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#8f6b32">
            Request Received
          </div>

          <p style="margin:9px 0 0;color:#334155;font-size:14px;line-height:1.7">
            ${
              isSiteViewing
                ? 'Your preferred site viewing date has been recorded. Our team will contact you to confirm the schedule.'
                : 'Your inquiry has been forwarded to our assigned real estate professional. Our team will contact you regarding your request.'
            }
          </p>

        </div>

        <!-- PROPERTY -->

        <div style="margin-top:24px;padding:22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:15px">

          <div style="font-size:12px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#64748b">
            Property
          </div>

          <div style="margin-top:9px;font-size:20px;font-weight:700;color:#071936">
            ${safePropertyTitle}
          </div>

          <div style="margin-top:8px;color:#64748b;font-size:14px">
            ${safePropertyLocation}
          </div>

          ${
            property
              ? `
          <div style="margin-top:14px;font-size:17px;font-weight:700;color:#8f6b32">
            ₱${safePropertyPrice}
          </div>
          `
              : ''
          }

        </div>

        ${
          isSiteViewing
            ? `
        <!-- VIEWING -->

        <div style="margin-top:18px;padding:22px;background:#fffdf7;border:1px solid #ead9b8;border-radius:15px">

          <div style="font-size:12px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#8f6b32">
            Preferred Site Viewing Date
          </div>

          <div style="margin-top:10px;font-size:20px;font-weight:700;color:#071936">
            ${escapeHtml(
              formattedViewingDate,
            )}
          </div>

          <p style="margin:10px 0 0;color:#64748b;font-size:13px;line-height:1.6">
            This is a preferred date and is not yet a confirmed appointment.
          </p>

        </div>
        `
            : ''
        }

        <!-- MESSAGE -->

        <div style="margin-top:18px;padding:22px;border:1px solid #e2e8f0;border-radius:15px">

          <div style="font-size:12px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#64748b">
            Your Message
          </div>

          <div style="margin-top:12px;color:#334155;font-size:14px;line-height:1.8;white-space:pre-wrap">
            ${escapeHtml(
              suppliedMessage ||
                'No additional message provided.',
            )}
          </div>

        </div>

        <!-- AGENT -->

        <div style="margin-top:25px;padding-top:22px;border-top:1px solid #e2e8f0">

          <p style="margin:0;color:#64748b;font-size:13px">
            Your assigned ${
              agent.role
            } is:
          </p>

          <p style="margin:6px 0 0;color:#071936;font-size:16px;font-weight:700">
            ${safeAgentName}
          </p>

        </div>

        <p style="margin:26px 0 0;color:#64748b;font-size:13px;line-height:1.7">
          If you need to provide additional information,
          you may reply directly to this email.
        </p>

      </div>

      <!-- FOOTER -->

      <div style="padding:28px 25px;background:#071936;text-align:center">

        <div style="font-size:14px;font-weight:bold;color:#ead9b8">
          BREA 88 REALTY OPC
        </div>

        <div style="margin-top:7px;color:#ffffff;font-size:13px">
          Service with a Heart
        </div>

        <div style="margin-top:7px;color:#94a3b8;font-size:11px">
          Service with a Heart, Building Trust from the Start.
        </div>

      </div>

    </div>

  </div>

</div>
`,
            },
          );

        if (
          !clientEmailResult.error
        ) {
          clientEmailSent = true;
        } else {
          console.error(
            'Resend client confirmation email error:',
            clientEmailResult.error,
          );
        }
      } catch (error) {
        console.error(
          'Inquiry email sending failed:',
          error,
        );
      }
    } else {
      console.error(
        'Resend is not configured. Missing RESEND_API_KEY or RESEND_FROM_EMAIL.',
      );
    }

    /* ========================================================
     * RESPONSE MESSAGE
     * ======================================================== */

    let notificationMessage =
      'Inquiry was saved successfully.';

    if (
      emailSent &&
      clientEmailSent &&
      smsSent
    ) {
      notificationMessage =
        'Inquiry submitted successfully. Confirmation email, agent email, and SMS notification were sent.';
    } else if (
      emailSent &&
      clientEmailSent
    ) {
      notificationMessage =
        'Inquiry submitted successfully. Confirmation email and agent email were sent.';
    } else if (clientEmailSent) {
      notificationMessage =
        'Inquiry submitted successfully. A confirmation email was sent to you.';
    } else if (emailSent) {
      notificationMessage =
        'Inquiry submitted successfully. The agent was notified by email.';
    } else if (smsSent) {
      notificationMessage =
        'Inquiry submitted successfully. The agent was notified by SMS.';
    } else {
      notificationMessage =
        'Inquiry was saved successfully, but email and SMS notifications could not be sent.';
    }

    return NextResponse.json(
      {
        success: true,
        emailSent,
        clientEmailSent,
        smsSent,
        pushSent,
        message: notificationMessage,
        inquiry,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      'POST /api/inquiries error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to submit inquiry.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * PATCH INQUIRY STATUS
 * ============================================================ */

export async function PATCH(
  request: Request,
) {
  try {
    const agent =
      await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Please log in as an agent.',
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid inquiry data.',
        },
        {
          status: 400,
        },
      );
    }

    const data =
      body as Record<string, unknown>;

    const id = Number(data.id);

    const status = cleanString(
      data.status,
    );

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid inquiry ID or status.',
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.inquiry.findFirst({
        where: {
          id,
          agentId: agent.id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Inquiry not found.',
        },
        {
          status: 404,
        },
      );
    }

    const inquiry =
      await prisma.inquiry.update({
        where: {
          id: existing.id,
        },

        data: {
          status,
        },

        include: inquiryInclude,
      });

    return NextResponse.json({
      success: true,
      message:
        'Inquiry status updated successfully.',
      inquiry,
    });
  } catch (error) {
    console.error(
      'PATCH /api/inquiries error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update inquiry.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * DELETE INQUIRY
 * ============================================================ */

export async function DELETE(
  request: Request,
) {
  try {
    const agent =
      await getAgentFromSession();

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Please log in as an agent.',
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid inquiry data.',
        },
        {
          status: 400,
        },
      );
    }

    const id = Number(
      (
        body as Record<
          string,
          unknown
        >
      ).id,
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid inquiry ID.',
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.inquiry.findFirst({
        where: {
          id,
          agentId: agent.id,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Inquiry not found.',
        },
        {
          status: 404,
        },
      );
    }

    await prisma.inquiry.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Inquiry deleted successfully.',
      inquiryId: existing.id,
    });
  } catch (error) {
    console.error(
      'DELETE /api/inquiries error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete inquiry.',
      },
      {
        status: 500,
      },
    );
  }
}