import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { Resend } from 'resend';
import twilio from 'twilio';

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePhoneNumber(value: string): string {
  const phone = value.trim();
  if (/^09\d{9}$/.test(phone)) return `+63${phone.slice(1)}`;
  if (/^63\d{10}$/.test(phone)) return `+${phone}`;
  if (/^\+\d{10,15}$/.test(phone)) return phone;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+\d{10,15}$/.test(cleaned) ? cleaned : '';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ['New', 'Read', 'Contacted', 'Viewing Scheduled', 'Viewing Completed', 'Follow Up', 'Closed', 'Cancelled'];

function parsePreferredViewingDate(value: unknown): Date | null | 'invalid' {
  const raw = cleanString(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'invalid';
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return 'invalid';
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (date.getTime() < todayUtc) return 'invalid';
  return date;
}

function formatViewingDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const inquiryInclude = {
  property: { select: { id: true, title: true, price: true, location: true, image: true, category: true, propertyType: true, houseType: true, storey: true } },
  agent: { select: { id: true, fullName: true, email: true, role: true, phone: true, profileImage: true } },
};

export async function GET() {
  try {
    const agent = await getAgentFromSession();
    if (!agent) return NextResponse.json({ success: false, message: 'Unauthorized. Please log in as an agent.' }, { status: 401 });
    const inquiries = await prisma.inquiry.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: 'desc' }, include: inquiryInclude });
    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error('GET /api/inquiries error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load inquiries.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 }); }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid inquiry data.' }, { status: 400 });

    const data = body as Record<string, unknown>;
    const name = cleanString(data.name);
    const email = cleanString(data.email).toLowerCase();
    const phone = cleanString(data.phone);
    const agentSlug = cleanString(data.agentSlug);
    const suppliedMessage = cleanString(data.message);

    if (name.length < 2 || name.length > 100) return NextResponse.json({ success: false, message: 'Please provide a valid name.' }, { status: 400 });
    if (!email || email.length > 255 || !emailPattern.test(email)) return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    if (phone.length < 7 || phone.length > 30) return NextResponse.json({ success: false, message: 'Please provide a valid phone number.' }, { status: 400 });
    if (!agentSlug || agentSlug.length > 100) return NextResponse.json({ success: false, message: 'Invalid agent.' }, { status: 400 });

    let propertyId: number | null = null;
    if (data.propertyId !== undefined && data.propertyId !== null && String(data.propertyId).trim() !== '') {
      const parsed = Number(data.propertyId);
      if (!Number.isInteger(parsed) || parsed <= 0) return NextResponse.json({ success: false, message: 'Invalid property ID.' }, { status: 400 });
      propertyId = parsed;
    }

    const preferredViewingDate = parsePreferredViewingDate(data.preferredViewingDate);
    if (preferredViewingDate === 'invalid') return NextResponse.json({ success: false, message: 'Please choose a valid site viewing date that is today or later.' }, { status: 400 });

    const agent = await prisma.agent.findFirst({
      where: { slug: agentSlug, isActive: true },
      select: { id: true, fullName: true, email: true, role: true, phone: true, profileImage: true },
    });
    if (!agent) return NextResponse.json({ success: false, message: 'The selected agent could not be found or is no longer active.' }, { status: 404 });

    const agentEmail = cleanString(agent.email).toLowerCase();
    if (!emailPattern.test(agentEmail)) return NextResponse.json({ success: false, message: 'The selected agent has an invalid registered email address.' }, { status: 400 });

    let property: { id: number; title: string; location: string; price: string } | null = null;
    if (propertyId !== null) {
      property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, title: true, location: true, price: true } });
      if (!property) return NextResponse.json({ success: false, message: 'Property not found.' }, { status: 404 });
    }

    const isSiteViewing = preferredViewingDate instanceof Date;
    const message = isSiteViewing
      ? `Site Viewing Request\nPreferred Date: ${formatViewingDate(preferredViewingDate)}\n\nThe client would like to schedule a site viewing for ${property?.title ?? 'this property'}. Please contact the client to confirm availability.`
      : suppliedMessage;

    if (!message || message.length > 2000) return NextResponse.json({ success: false, message: 'Inquiry message is required.' }, { status: 400 });

    const inquiry = await prisma.inquiry.create({
      data: { name, email, phone, message, propertyId, agentId: agent.id, preferredViewingDate: isSiteViewing ? preferredViewingDate : null, status: 'New' },
      include: inquiryInclude,
    });

    let smsSent = false;
    let emailSent = false;
    const agentPhone = agent.phone ? normalizePhoneNumber(agent.phone) : '';

    const twilioAccountSid = cleanString(process.env.TWILIO_ACCOUNT_SID);
    const twilioAuthToken = cleanString(process.env.TWILIO_AUTH_TOKEN);
    const twilioPhoneNumber = cleanString(process.env.TWILIO_PHONE_NUMBER);
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && agentPhone) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        const smsMessage = isSiteViewing
          ? `BREA 88 REALTY: New site viewing request from ${name} for "${property?.title ?? 'a property'}". Preferred date: ${formatViewingDate(preferredViewingDate)}. Contact: ${phone}. Inquiry #${inquiry.id}.`
          : property
            ? `BREA 88 REALTY: New inquiry from ${name} about "${property.title}". Contact: ${phone}. Inquiry #${inquiry.id}.`
            : `BREA 88 REALTY: New client inquiry from ${name}. Contact: ${phone}. Inquiry #${inquiry.id}.`;
        await twilioClient.messages.create({ body: smsMessage, from: twilioPhoneNumber, to: agentPhone });
        smsSent = true;
      } catch (error) { console.error('Inquiry SMS sending failed:', error); }
    }

    const resendApiKey = cleanString(process.env.RESEND_API_KEY);
    const fromEmail = cleanString(process.env.RESEND_FROM_EMAIL);
    if (resendApiKey && fromEmail) {
      try {
        const resend = new Resend(resendApiKey);
        const safeAgentName = escapeHtml(agent.fullName);
        const safeClientName = escapeHtml(name);
        const safeClientEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone);
        const safeMessage = escapeHtml(message);
        const safePropertyTitle = escapeHtml(property?.title ?? 'No specific property');
        const safePropertyLocation = escapeHtml(property?.location ?? 'Agent Profile Inquiry');
        const safePropertyPrice = escapeHtml(property?.price ?? 'N/A');
        const viewingSection = isSiteViewing ? `\nPREFERRED SITE VIEWING DATE\n---------------------------\n${formatViewingDate(preferredViewingDate)}\n\nThis is a preferred date and is not yet confirmed. Please contact the client to confirm availability.\n` : '';
        const result = await resend.emails.send({
          from: fromEmail,
          to: [agentEmail],
          replyTo: email,
          subject: isSiteViewing ? `Site Viewing Request - ${property?.title ?? 'Property'}` : property ? `New Property Inquiry - ${property.title}` : `New Client Inquiry - ${agent.fullName}`,
          text: `NEW ${isSiteViewing ? 'SITE VIEWING REQUEST' : 'PROPERTY INQUIRY'}\n\nPROPERTY\nTitle: ${property?.title ?? 'No specific property'}\nPrice: ${property ? `₱${property.price}` : 'N/A'}\nLocation: ${property?.location ?? 'Agent Profile Inquiry'}\n\nCLIENT\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n${viewingSection}\nMESSAGE\n${message}\n\nInquiry ID: ${inquiry.id}\nStatus: ${inquiry.status}\nSubmitted: ${inquiry.createdAt.toLocaleString()}\n\nBREA 88 REALTY\nService with a Heart`,
          html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:30px"><div style="max-width:650px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="background:#071936;padding:28px;color:#fff"><h1 style="margin:0;font-size:24px">${isSiteViewing ? 'Site Viewing Request' : 'New Property Inquiry'}</h1><p style="margin:8px 0 0;color:#ead9b8">BREA 88 REALTY</p></div><div style="padding:30px"><p>Hello ${safeAgentName},</p><div style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px"><h2>Property</h2><p><strong>Title:</strong> ${safePropertyTitle}</p><p><strong>Price:</strong> ₱${safePropertyPrice}</p><p><strong>Location:</strong> ${safePropertyLocation}</p></div><div style="margin-top:18px;padding:18px;border:1px solid #e2e8f0;border-radius:12px"><h2>Client Information</h2><p><strong>Name:</strong> ${safeClientName}</p><p><strong>Email:</strong> ${safeClientEmail}</p><p><strong>Phone:</strong> ${safePhone}</p></div>${isSiteViewing ? `<div style="margin-top:18px;padding:18px;background:#faf7ef;border:1px solid #ead9b8;border-radius:12px"><h2>Preferred Site Viewing Date</h2><p style="font-size:18px;font-weight:bold">${escapeHtml(formatViewingDate(preferredViewingDate))}</p><p>This is a preferred date, not a confirmed appointment.</p></div>` : ''}<div style="margin-top:18px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px"><h2>Message</h2><p style="white-space:pre-wrap;line-height:1.7">${safeMessage}</p></div><p style="color:#64748b;font-size:13px;margin-top:24px">Inquiry #${inquiry.id}. You can reply directly to this email to contact the client.</p></div><div style="padding:20px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px">BREA 88 REALTY<br/>Service with a Heart</div></div></div>`,
        });
        if (!result.error) emailSent = true;
        else console.error('Resend inquiry email error:', result.error);
      } catch (error) { console.error('Inquiry email sending failed:', error); }
    }

    const notificationMessage = emailSent && smsSent
      ? 'Inquiry submitted successfully. Email and SMS notifications were sent.'
      : emailSent
        ? 'Inquiry submitted successfully. Email notification was sent, but SMS notification could not be sent.'
        : smsSent
          ? 'Inquiry submitted successfully. SMS notification was sent, but email notification could not be sent.'
          : 'Inquiry was saved successfully, but email and SMS notifications could not be sent.';

    return NextResponse.json({ success: true, emailSent, smsSent, message: notificationMessage, inquiry }, { status: 201 });
  } catch (error) {
    console.error('POST /api/inquiries error:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit inquiry.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const agent = await getAgentFromSession();
    if (!agent) return NextResponse.json({ success: false, message: 'Unauthorized. Please log in as an agent.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid inquiry data.' }, { status: 400 });
    const data = body as Record<string, unknown>;
    const id = Number(data.id);
    const status = cleanString(data.status);
    if (!Number.isInteger(id) || id <= 0 || !allowedStatuses.includes(status)) return NextResponse.json({ success: false, message: 'Invalid inquiry ID or status.' }, { status: 400 });
    const existing = await prisma.inquiry.findFirst({ where: { id, agentId: agent.id } });
    if (!existing) return NextResponse.json({ success: false, message: 'Inquiry not found.' }, { status: 404 });
    const inquiry = await prisma.inquiry.update({ where: { id: existing.id }, data: { status }, include: inquiryInclude });
    return NextResponse.json({ success: true, message: 'Inquiry status updated successfully.', inquiry });
  } catch (error) {
    console.error('PATCH /api/inquiries error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update inquiry.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const agent = await getAgentFromSession();
    if (!agent) return NextResponse.json({ success: false, message: 'Unauthorized. Please log in as an agent.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid inquiry data.' }, { status: 400 });
    const id = Number((body as Record<string, unknown>).id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, message: 'Invalid inquiry ID.' }, { status: 400 });
    const existing = await prisma.inquiry.findFirst({ where: { id, agentId: agent.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, message: 'Inquiry not found.' }, { status: 404 });
    await prisma.inquiry.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully.', inquiryId: existing.id });
  } catch (error) {
    console.error('DELETE /api/inquiries error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete inquiry.' }, { status: 500 });
  }
}
