import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('GET /api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load properties.',
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

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const tag =
      typeof body.tag === 'string'
        ? body.tag.trim()
        : '';

    const price =
      typeof body.price === 'string'
        ? body.price.trim()
        : '';

    const location =
      typeof body.location === 'string'
        ? body.location.trim()
        : '';

    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : '';

    const images = Array.isArray(body.images)
      ? body.images.filter(
          (item: unknown): item is string =>
            typeof item === 'string' &&
            item.trim().length > 0
        )
      : [];

    const beds =
      body.beds !== undefined &&
      body.beds !== null &&
      body.beds !== ''
        ? Number(body.beds)
        : null;

    const baths =
      body.baths !== undefined &&
      body.baths !== null &&
      body.baths !== ''
        ? Number(body.baths)
        : null;

    const sqft =
      body.sqft !== undefined &&
      body.sqft !== null &&
      body.sqft !== ''
        ? Number(body.sqft)
        : null;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property title is required.',
        },
        { status: 400 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property category is required.',
        },
        { status: 400 }
      );
    }

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property price is required.',
        },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property location is required.',
        },
        { status: 400 }
      );
    }

    if (!image && images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    if (
      beds !== null &&
      (!Number.isInteger(beds) || beds < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid number of bedrooms.',
        },
        { status: 400 }
      );
    }

    if (
      baths !== null &&
      (!Number.isInteger(baths) || baths < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid number of bathrooms.',
        },
        { status: 400 }
      );
    }

    if (
      sqft !== null &&
      (!Number.isFinite(sqft) || sqft < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid floor area.',
        },
        { status: 400 }
      );
    }

    const finalImages =
      images.length > 0
        ? images
        : image
        ? [image]
        : [];

    const coverImage = finalImages[0];

    const property = await prisma.property.create({
      data: {
        title,
        tag,
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
        message: 'Property created successfully.',
        property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create property.',
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
