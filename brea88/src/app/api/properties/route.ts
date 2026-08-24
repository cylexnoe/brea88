import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0
  ).map((item) => item.trim());
}

function parseOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function parseOptionalFloat(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

// ==========================================
// GET ALL PROPERTIES
// ==========================================

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

// ==========================================
// CREATE PROPERTY
// ==========================================

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

    const images = cleanImages(body.images);

    const beds = parseOptionalInteger(body.beds);
    const baths = parseOptionalInteger(body.baths);
    const sqft = parseOptionalFloat(body.sqft);

    // ==========================================
    // VALIDATION
    // ==========================================

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
      body.beds !== undefined &&
      body.beds !== null &&
      body.beds !== '' &&
      beds === null
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
      body.baths !== undefined &&
      body.baths !== null &&
      body.baths !== '' &&
      baths === null
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
      body.sqft !== undefined &&
      body.sqft !== null &&
      body.sqft !== '' &&
      sqft === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid floor area.',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // PREPARE IMAGES
    // ==========================================

    const finalImages =
      images.length > 0
        ? images
        : image
        ? [image]
        : [];

    const coverImage = finalImages[0];

    // ==========================================
    // CREATE DATABASE RECORD
    // ==========================================

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

// ==========================================
// UPDATE PROPERTY
// ==========================================

export async function PUT(request: Request) {
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

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

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

    const images = cleanImages(body.images);

    const beds = parseOptionalInteger(body.beds);
    const baths = parseOptionalInteger(body.baths);
    const sqft = parseOptionalFloat(body.sqft);

    // ==========================================
    // VALIDATION
    // ==========================================

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

    // ==========================================
    // PREPARE IMAGES
    // ==========================================

    const finalImages =
      images.length > 0
        ? images
        : image
        ? [image]
        : [];

    const coverImage = finalImages[0];

    // ==========================================
    // UPDATE DATABASE RECORD
    // ==========================================

    const property = await prisma.property.update({
      where: {
        id,
      },
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
        message: 'Property updated successfully.',
        property,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update property.',
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

