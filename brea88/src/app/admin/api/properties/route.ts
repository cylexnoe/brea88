import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/*
|--------------------------------------------------------------------------
| GET /api/properties
|--------------------------------------------------------------------------
| Fetch all properties with their assigned agent.
*/
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            messenger: true,
            facebook: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('GET /api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch properties',
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/properties
|--------------------------------------------------------------------------
| Create a new property.
*/
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('POST /api/properties body:', body);

    /*
     * Required fields
     */
    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property title is required.',
        },
        { status: 400 }
      );
    }

    if (!body.tag?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property tag is required.',
        },
        { status: 400 }
      );
    }

    if (!body.location?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property location is required.',
        },
        { status: 400 }
      );
    }

    /*
     * Your Prisma schema requires image to be a String.
     * If no image is supplied, use an empty string.
     */
    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : '';

    /*
     * Price is a STRING in your Prisma schema.
     *
     * We keep it as a string so values such as:
     *
     * 12500000
     * ₱12,500,000
     * 12,500,000
     *
     * can be stored safely.
     */
    let price = '';

    if (
      body.price !== null &&
      body.price !== undefined
    ) {
      price = String(body.price).trim();
    }

    /*
     * Images must be a PostgreSQL String[].
     */
    const images = Array.isArray(body.images)
      ? body.images.filter(
          (image: unknown): image is string =>
            typeof image === 'string' &&
            image.trim().length > 0
        )
      : [];

    /*
     * Convert numeric values safely.
     */
    const beds =
      body.beds === null ||
      body.beds === undefined ||
      body.beds === ''
        ? null
        : Number(body.beds);

    const baths =
      body.baths === null ||
      body.baths === undefined ||
      body.baths === ''
        ? null
        : Number(body.baths);

    const sqft =
      body.sqft === null ||
      body.sqft === undefined ||
      body.sqft === ''
        ? null
        : Number(body.sqft);

    /*
     * Validate numeric fields.
     */
    if (
      beds !== null &&
      !Number.isFinite(beds)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bedrooms must be a valid number.',
        },
        { status: 400 }
      );
    }

    if (
      baths !== null &&
      !Number.isFinite(baths)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bathrooms must be a valid number.',
        },
        { status: 400 }
      );
    }

    if (
      sqft !== null &&
      !Number.isFinite(sqft)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Area must be a valid number.',
        },
        { status: 400 }
      );
    }

    /*
     * Agent
     *
     * Your Property model uses:
     *
     * agentId Int?
     */
    const agentId =
      body.agentId === null ||
      body.agentId === undefined ||
      body.agentId === ''
        ? null
        : Number(body.agentId);

    if (
      agentId !== null &&
      !Number.isInteger(agentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid agent ID.',
        },
        { status: 400 }
      );
    }

    /*
     * Create property
     */
    const property = await prisma.property.create({
      data: {
        title: body.title.trim(),
        tag: body.tag.trim(),

        category:
          body.category?.trim() || null,

        propertyType:
          body.propertyType?.trim() || null,

        houseType:
          body.houseType?.trim() || null,

        storey:
          body.storey?.trim() || null,

        price,

        location: body.location.trim(),

        image,

        images,

        beds,

        baths,

        sqft,

        agentId,
      },

      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            messenger: true,
            facebook: true,
          },
        },
      },
    });

    console.log(
      'Property successfully created:',
      property.id
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Property saved successfully.',
        property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/properties error:',
      error
    );

    /*
     * Return the actual error during development
     * instead of hiding it behind "Something went wrong".
     */
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown server error';

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create property.',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}