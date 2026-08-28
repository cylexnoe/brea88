import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

/*
|--------------------------------------------------------------------------
| GET /admin/api/properties
|--------------------------------------------------------------------------
| Fetch all properties with their assigned agent.
|
| GET is intentionally public/read-only here.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const properties =
      await prisma.property.findMany({
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
    console.error(
      'GET /admin/api/properties error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch properties.',
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /admin/api/properties
|--------------------------------------------------------------------------
| Create a new property.
|
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN AUTHORIZATION
    |--------------------------------------------------------------------------
    */

    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PARSE REQUEST
    |--------------------------------------------------------------------------
    */

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
        { status: 400 }
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
            'Invalid property data.',
        },
        { status: 400 }
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    const title =
      typeof data.title === 'string'
        ? data.title.trim()
        : '';

    const tag =
      typeof data.tag === 'string'
        ? data.tag.trim()
        : '';

    const location =
      typeof data.location === 'string'
        ? data.location.trim()
        : '';

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Property title is required.',
        },
        { status: 400 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Property tag is required.',
        },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Property location is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRICE
    |--------------------------------------------------------------------------
    */

    let price = '';

    if (
      data.price !== null &&
      data.price !== undefined
    ) {
      price =
        String(data.price).trim();
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

    const image =
      typeof data.image === 'string'
        ? data.image.trim()
        : '';

    /*
    |--------------------------------------------------------------------------
    | IMAGES
    |--------------------------------------------------------------------------
    */

    const images =
      Array.isArray(data.images)
        ? data.images.filter(
            (
              value: unknown
            ): value is string =>
              typeof value ===
                'string' &&
              value.trim().length >
                0
          ).map(
            (value) =>
              value.trim()
          )
        : [];

    /*
    |--------------------------------------------------------------------------
    | NUMERIC FIELDS
    |--------------------------------------------------------------------------
    */

    const beds =
      data.beds === null ||
      data.beds === undefined ||
      data.beds === ''
        ? null
        : Number(data.beds);

    const baths =
      data.baths === null ||
      data.baths === undefined ||
      data.baths === ''
        ? null
        : Number(data.baths);

    const sqft =
      data.sqft === null ||
      data.sqft === undefined ||
      data.sqft === ''
        ? null
        : Number(data.sqft);

    /*
    |--------------------------------------------------------------------------
    | NUMERIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      beds !== null &&
      (!Number.isInteger(beds) ||
        beds < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Bedrooms must be a valid non-negative integer.',
        },
        { status: 400 }
      );
    }

    if (
      baths !== null &&
      (!Number.isInteger(baths) ||
        baths < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Bathrooms must be a valid non-negative integer.',
        },
        { status: 400 }
      );
    }

    if (
      sqft !== null &&
      (!Number.isFinite(sqft) ||
        sqft < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Area must be a valid non-negative number.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AGENT
    |--------------------------------------------------------------------------
    */

    const agentId =
      data.agentId === null ||
      data.agentId === undefined ||
      data.agentId === ''
        ? null
        : Number(data.agentId);

    if (
      agentId !== null &&
      (!Number.isInteger(agentId) ||
        agentId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid agent ID.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY AGENT EXISTS
    |--------------------------------------------------------------------------
    */

    if (agentId !== null) {
      const agent =
        await prisma.agent.findUnique({
          where: {
            id: agentId,
          },
          select: {
            id: true,
            isActive: true,
          },
        });

      if (!agent) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Assigned agent does not exist.',
          },
          { status: 400 }
        );
      }

      if (!agent.isActive) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Cannot assign a property to an inactive agent.',
          },
          { status: 400 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE REQUIREMENT
    |--------------------------------------------------------------------------
    |
    | The Prisma schema requires `image`.
    |
    | If images[] exists but image is empty,
    | use the first image as the cover image.
    |--------------------------------------------------------------------------
    */

    const finalImages =
      images.length > 0
        ? images
        : image
          ? [image]
          : [];

    const coverImage =
      image ||
      finalImages[0] ||
      '';

    if (!coverImage) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL TEXT FIELDS
    |--------------------------------------------------------------------------
    */

    const category =
      typeof data.category === 'string'
        ? data.category.trim() ||
          null
        : null;

    const propertyType =
      typeof data.propertyType ===
      'string'
        ? data.propertyType.trim() ||
          null
        : null;

    const houseType =
      typeof data.houseType ===
      'string'
        ? data.houseType.trim() ||
          null
        : null;

    const storey =
      typeof data.storey === 'string'
        ? data.storey.trim() ||
          null
        : null;

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY
    |--------------------------------------------------------------------------
    */

    const property =
      await prisma.property.create({
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

    return NextResponse.json(
      {
        success: true,
        message:
          'Property saved successfully.',
        property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /admin/api/properties error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create property.',
        debug:
          process.env.NODE_ENV !==
            'production' &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

