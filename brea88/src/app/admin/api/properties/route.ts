import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isSafeHttpUrl } from '@/lib/security';

const ALLOWED_TAGS = new Set(['Residential', 'Commercial', 'Investment', 'All']);
const MAX_IMAGES = 10;

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result && result.length <= max ? result : null;
}

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => isSafeHttpUrl(item))
    .slice(0, MAX_IMAGES);
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error('GET /admin/api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to fetch properties.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid property data.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const title = cleanString(data.title, 200);
    const tag = cleanString(data.tag, 30);
    const location = cleanString(data.location, 300);
    const price = cleanString(data.price, 100);
    const category = cleanString(data.category, 100);
    const propertyType = cleanString(data.propertyType, 100);
    const houseType = cleanString(data.houseType, 100);
    const storey = cleanString(data.storey, 30);
    const images = cleanImages(data.images);
    const singleImage = cleanString(data.image, 2048);
    const image = singleImage && isSafeHttpUrl(singleImage) ? singleImage : '';
    const beds = optionalNumber(data.beds);
    const baths = optionalNumber(data.baths);
    const sqft = optionalNumber(data.sqft);

    if (!title || !tag || !location || !price) {
      return NextResponse.json({ success: false, message: 'Title, tag, price, and location are required.' }, { status: 400 });
    }

    if (!ALLOWED_TAGS.has(tag)) {
      return NextResponse.json({ success: false, message: 'Invalid property tag.' }, { status: 400 });
    }

    if ((data.beds !== undefined && data.beds !== null && data.beds !== '' && beds === null) ||
        (data.baths !== undefined && data.baths !== null && data.baths !== '' && baths === null) ||
        (data.sqft !== undefined && data.sqft !== null && data.sqft !== '' && sqft === null)) {
      return NextResponse.json({ success: false, message: 'Invalid property measurements.' }, { status: 400 });
    }

    const finalImages = images.length ? images : image ? [image] : [];
    if (!finalImages.length) {
      return NextResponse.json({ success: false, message: 'At least one valid property image is required.' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title,
        tag,
        category,
        propertyType,
        houseType,
        storey,
        price,
        location,
        image: finalImages[0],
        images: finalImages,
        beds: beds === null ? null : Math.floor(beds),
        baths: baths === null ? null : Math.floor(baths),
        sqft,
      },
    });

    return NextResponse.json({ success: true, message: 'Property saved successfully.', property }, { status: 201 });
  } catch (error) {
    console.error('POST /admin/api/properties failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Failed to create property.' }, { status: 500 });
  }
}
