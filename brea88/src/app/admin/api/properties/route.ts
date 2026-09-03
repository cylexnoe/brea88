import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

/*
|--------------------------------------------------------------------------
| ADMIN PROPERTY API
|--------------------------------------------------------------------------
| Properties are managed only by Admin.
| Agents/Brokers are never selected or assigned here.
|
| Agent/Broker ownership for CRM activity is determined by the
| authenticated account/session and by the public profile/inquiry flow.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('GET /admin/api/properties error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to fetch properties.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
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
        { success: false, message: 'Invalid property data.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const tag = typeof data.tag === 'string' ? data.tag.trim() : '';
    const location = typeof data.location === 'string' ? data.location.trim() : '';

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Property title is required.' },
        { status: 400 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'Property tag is required.' },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Property location is required.' },
        { status: 400 }
      );
    }

    const price =
      data.price !== null && data.price !== undefined
        ? String(data.price).trim()
        : '';

    const image = typeof data.image === 'string' ? data.image.trim() : '';

    const images = Array.isArray(data.images)
      ? data.images
          .filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0
          )
          .map((value) => value.trim())
      : [];

    const beds =
      data.beds === null || data.beds === undefined || data.beds === ''
        ? null
        : Number(data.beds);

    const baths =
      data.baths === null || data.baths === undefined || data.baths === ''
        ? null
        : Number(data.baths);

    const sqft =
      data.sqft === null || data.sqft === undefined || data.sqft === ''
        ? null
        : Number(data.sqft);

    if (beds !== null && (!Number.isInteger(beds) || beds < 0)) {
      return NextResponse.json(
        { success: false, message: 'Bedrooms must be a valid non-negative integer.' },
        { status: 400 }
      );
    }

    if (baths !== null && (!Number.isInteger(baths) || baths < 0)) {
      return NextResponse.json(
        { success: false, message: 'Bathrooms must be a valid non-negative integer.' },
        { status: 400 }
      );
    }

    if (sqft !== null && (!Number.isFinite(sqft) || sqft < 0)) {
      return NextResponse.json(
        { success: false, message: 'Area must be a valid non-negative number.' },
        { status: 400 }
      );
    }

    const finalImages = images.length > 0 ? images : image ? [image] : [];
    const coverImage = image || finalImages[0] || '';

    if (!coverImage) {
      return NextResponse.json(
        { success: false, message: 'At least one property image is required.' },
        { status: 400 }
      );
    }

    const category =
      typeof data.category === 'string' ? data.category.trim() || null : null;

    const propertyType =
      typeof data.propertyType === 'string'
        ? data.propertyType.trim() || null
        : null;

    const houseType =
      typeof data.houseType === 'string'
        ? data.houseType.trim() || null
        : null;

    const storey =
      typeof data.storey === 'string' ? data.storey.trim() || null : null;

    /*
     * Deliberately do not read or accept agentId here.
     * Admin manages the property record, but does not assign it to an
     * Agent/Broker. CRM ownership is handled by the authenticated account.
     */
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
        image: coverImage,
        images: finalImages,
        beds,
        baths,
        sqft,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Property saved successfully.',
        property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /admin/api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create property.',
        debug:
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
