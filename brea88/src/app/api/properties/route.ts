import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { hasValidContentLength, isSafeHttpUrl } from '@/lib/security';

const ALLOWED_TAGS = new Set(['Residential', 'Commercial', 'Investment', 'All']);
const MAX_IMAGES = 10;
const MAX_JSON_BYTES = 256 * 1024;

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maxLength ? cleaned : null;
}

function cleanOptionalString(value: unknown, maxLength: number): string | null {
  return cleanString(value, maxLength) || null;
}

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => isSafeHttpUrl(item))
    .slice(0, MAX_IMAGES);
}

function parseOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function parseOptionalFloat(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000_000 ? number : null;
}

async function validateAgent(agentId: number | null) {
  if (agentId === null) return { agent: null };
  if (!Number.isSafeInteger(agentId) || agentId <= 0) {
    return { error: NextResponse.json({ success: false, message: 'Invalid agent ID.' }, { status: 400 }) };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, isActive: true, role: true },
  });

  if (!agent || !['Agent', 'Broker'].includes(agent.role)) {
    return { error: NextResponse.json({ success: false, message: 'Assigned Agent or Broker does not exist.' }, { status: 400 }) };
  }

  if (!agent.isActive) {
    return { error: NextResponse.json({ success: false, message: 'Cannot assign a property to an inactive account.' }, { status: 400 }) };
  }

  return { agent };
}

function parsePropertyBody(body: unknown) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;

  const title = cleanString(data.title, 200);
  const tag = cleanString(data.tag, 30);
  const price = cleanString(data.price, 100);
  const location = cleanString(data.location, 300);
  const category = cleanOptionalString(data.category, 100);
  const propertyType = cleanOptionalString(data.propertyType, 120);
  const houseType = cleanOptionalString(data.houseType, 100);
  const storey = cleanOptionalString(data.storey, 30);
  const image = cleanString(data.image, 2048);
  const images = cleanImages(data.images);
  const beds = parseOptionalInteger(data.beds);
  const baths = parseOptionalInteger(data.baths);
  const sqft = parseOptionalFloat(data.sqft);
  const agentId = data.agentId === null || data.agentId === undefined || data.agentId === '' ? null : Number(data.agentId);

  if (!title || !tag || !price || !location) return { error: 'Title, tag, price, and location are required.' };
  if (!ALLOWED_TAGS.has(tag)) return { error: 'Invalid property tag.' };
  if (image && !isSafeHttpUrl(image)) return { error: 'Property image URL must use HTTPS.' };
  if (data.beds !== undefined && data.beds !== null && data.beds !== '' && beds === null) return { error: 'Invalid number of bedrooms.' };
  if (data.baths !== undefined && data.baths !== null && data.baths !== '' && baths === null) return { error: 'Invalid number of bathrooms.' };
  if (data.sqft !== undefined && data.sqft !== null && data.sqft !== '' && sqft === null) return { error: 'Invalid floor area.' };
  if (agentId !== null && (!Number.isSafeInteger(agentId) || agentId <= 0)) return { error: 'Invalid agent ID.' };

  const finalImages = images.length > 0 ? images : image ? [image] : [];
  if (finalImages.length === 0) return { error: 'At least one valid property image is required.' };

  return {
    data: {
      title,
      tag,
      price,
      location,
      category,
      propertyType,
      houseType,
      storey,
      image: finalImages[0],
      images: finalImages,
      beds,
      baths,
      sqft,
      agentId,
    },
  };
}

const agentSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  slug: true,
  phone: true,
  profileImage: true,
  bio: true,
  facebook: true,
  messenger: true,
} as const;

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: agentSelect } },
    });

    return NextResponse.json(properties, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to load properties.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  if (!hasValidContentLength(request, MAX_JSON_BYTES)) return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });

  try {
    const parsed = parsePropertyBody(await request.json().catch(() => null));
    if (!parsed) return NextResponse.json({ success: false, message: 'Invalid property data.' }, { status: 400 });
    if ('error' in parsed) return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });

    const agentValidation = await validateAgent(parsed.data.agentId);
    if (agentValidation.error) return agentValidation.error;

    const property = await prisma.property.create({ data: parsed.data, include: { agent: { select: agentSelect } } });
    return NextResponse.json({ success: true, message: 'Property created successfully.', property }, { status: 201 });
  } catch (error) {
    console.error('POST /api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to create property.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  if (!hasValidContentLength(request, MAX_JSON_BYTES)) return NextResponse.json({ success: false, message: 'Request is too large.' }, { status: 413 });

  try {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid property data.' }, { status: 400 });

    const id = Number((body as Record<string, unknown>).id);
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ success: false, message: 'Invalid property ID.' }, { status: 400 });

    const parsed = parsePropertyBody(body);
    if (!parsed) return NextResponse.json({ success: false, message: 'Invalid property data.' }, { status: 400 });
    if ('error' in parsed) return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });

    const agentValidation = await validateAgent(parsed.data.agentId);
    if (agentValidation.error) return agentValidation.error;

    const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, message: 'Property not found.' }, { status: 404 });

    const property = await prisma.property.update({ where: { id }, data: parsed.data, include: { agent: { select: agentSelect } } });
    return NextResponse.json({ success: true, message: 'Property updated successfully.', property });
  } catch (error) {
    console.error('PUT /api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to update property.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ success: false, message: 'Invalid property ID.' }, { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, message: 'Property not found.' }, { status: 404 });

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Property deleted successfully.' });
  } catch (error) {
    console.error('DELETE /api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to delete property.' }, { status: 500 });
  }
}
