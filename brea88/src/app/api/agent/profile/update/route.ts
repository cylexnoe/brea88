import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgentFromSession } from '@/lib/agent-auth';
import { hasValidContentLength, isSafeHttpUrl } from '@/lib/security';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(request: Request) {
  try {
    const agent = await getAgentFromSession();
    if (!agent) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    if (!hasValidContentLength(request, 64 * 1024)) {
      return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() || null : null;
    const address = typeof data.address === 'string' ? data.address.trim() || null : null;
    const bio = typeof data.bio === 'string' ? data.bio.trim() || null : null;
    const facebook = typeof data.facebook === 'string' ? data.facebook.trim() || null : null;
    const messenger = typeof data.messenger === 'string' ? data.messenger.trim() || null : null;
    const profileImage = typeof data.profileImage === 'string' ? data.profileImage.trim() || null : null;

    if (fullName.length < 2 || fullName.length > 100) return NextResponse.json({ success: false, message: 'Please provide a valid full name.' }, { status: 400 });
    if (!email || email.length > 254 || !emailPattern.test(email)) return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    if (phone && phone.length > 50) return NextResponse.json({ success: false, message: 'Phone number is too long.' }, { status: 400 });
    if (address && address.length > 500) return NextResponse.json({ success: false, message: 'Address is too long.' }, { status: 400 });
    if (bio && bio.length > 2000) return NextResponse.json({ success: false, message: 'Bio is too long.' }, { status: 400 });
    if (facebook && (!isSafeHttpUrl(facebook, 500))) return NextResponse.json({ success: false, message: 'Facebook link must be a valid HTTPS URL.' }, { status: 400 });
    if (messenger && (!isSafeHttpUrl(messenger, 500))) return NextResponse.json({ success: false, message: 'Messenger link must be a valid HTTPS URL.' }, { status: 400 });
    if (profileImage && (!isSafeHttpUrl(profileImage, 2048))) return NextResponse.json({ success: false, message: 'Profile image must be a valid HTTPS URL.' }, { status: 400 });

    const existingEmail = await prisma.agent.findFirst({
      where: { email, NOT: { id: agent.id } },
      select: { id: true },
    });

    if (existingEmail) return NextResponse.json({ success: false, message: 'This email is already being used.' }, { status: 409 });

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { fullName, email, phone, address, bio, facebook, messenger, profileImage },
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

    return NextResponse.json({ success: true, message: 'Profile updated successfully.', agent: updatedAgent });
  } catch (error) {
    console.error('PUT /api/agent/profile/update failed:', error instanceof Error ? error.message : 'Unknown error');
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'This email is already being used.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Unable to update profile.' }, { status: 500 });
  }
}
