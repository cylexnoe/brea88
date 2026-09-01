import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0
    )
    .map((item) => item.trim());
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
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

/*
|--------------------------------------------------------------------------
| AGENT VALIDATION
|--------------------------------------------------------------------------
*/

async function validateAgent(agentId: number | null) {
  if (agentId === null) {
    return null;
  }

  if (!Number.isInteger(agentId) || agentId <= 0) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Invalid agent ID.',
        },
        { status: 400 }
      ),
    };
  }

  const agent = await prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!agent) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Assigned agent does not exist.',
        },
        { status: 400 }
      ),
    };
  }

  if (!agent.isActive) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Cannot assign a property to an inactive agent.',
        },
        { status: 400 }
      ),
    };
  }

  return {
    agent,
  };
}

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTIES
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        agent: {
          select: {
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
          },
        },
      },
    });

    console.log(
      'GET /api/properties:',
      properties.length,
      'properties found'
    );

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

/*
|--------------------------------------------------------------------------
| CREATE PROPERTY
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | BASIC PROPERTY INFORMATION
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | PROPERTY CLASSIFICATION
    |--------------------------------------------------------------------------
    */

    const category = cleanOptionalString(body.category);

    const propertyType = cleanOptionalString(
      body.propertyType
    );

    const houseType = cleanOptionalString(
      body.houseType
    );

    const storey = cleanOptionalString(
      body.storey
    );

    /*
    |--------------------------------------------------------------------------
    | IMAGES
    |--------------------------------------------------------------------------
    */

    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : '';

    const images = cleanImages(body.images);

    /*
    |--------------------------------------------------------------------------
    | PROPERTY DETAILS
    |--------------------------------------------------------------------------
    */

    const beds = parseOptionalInteger(body.beds);

    const baths = parseOptionalInteger(body.baths);

    const sqft = parseOptionalFloat(body.sqft);

    /*
    |--------------------------------------------------------------------------
    | AGENT
    |--------------------------------------------------------------------------
    */

    const agentId =
      body.agentId === null ||
      body.agentId === undefined ||
      body.agentId === ''
        ? null
        : Number(body.agentId);

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELD VALIDATION
    |--------------------------------------------------------------------------
    */

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
          message: 'Property tag is required.',
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

    /*
    |--------------------------------------------------------------------------
    | IMAGE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!image && images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBER VALIDATION
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | VALIDATE AGENT
    |--------------------------------------------------------------------------
    */

    const agentValidation = await validateAgent(agentId);

    if (agentValidation?.error) {
      return agentValidation.error;
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE IMAGES
    |--------------------------------------------------------------------------
    */

    const finalImages =
      images.length > 0
        ? images
        : image
          ? [image]
          : [];

    const coverImage = finalImages[0];

    if (!coverImage) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY
    |--------------------------------------------------------------------------
    */

    const property = await prisma.property.create({
      data: {
        title,
        tag,
        price,
        location,

        category,
        propertyType,
        houseType,
        storey,

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
            role: true,
            slug: true,
            phone: true,
            profileImage: true,
            bio: true,
            facebook: true,
            messenger: true,
          },
        },
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

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | BASIC PROPERTY INFORMATION
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | PROPERTY CLASSIFICATION
    |--------------------------------------------------------------------------
    */

    const category = cleanOptionalString(body.category);

    const propertyType = cleanOptionalString(
      body.propertyType
    );

    const houseType = cleanOptionalString(
      body.houseType
    );

    const storey = cleanOptionalString(
      body.storey
    );

    /*
    |--------------------------------------------------------------------------
    | IMAGES
    |--------------------------------------------------------------------------
    */

    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : '';

    const images = cleanImages(body.images);

    /*
    |--------------------------------------------------------------------------
    | PROPERTY DETAILS
    |--------------------------------------------------------------------------
    */

    const beds = parseOptionalInteger(body.beds);

    const baths = parseOptionalInteger(body.baths);

    const sqft = parseOptionalFloat(body.sqft);

    /*
    |--------------------------------------------------------------------------
    | AGENT
    |--------------------------------------------------------------------------
    */

    const agentId =
      body.agentId === null ||
      body.agentId === undefined ||
      body.agentId === ''
        ? null
        : Number(body.agentId);

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELD VALIDATION
    |--------------------------------------------------------------------------
    */

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
          message: 'Property tag is required.',
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

    /*
    |--------------------------------------------------------------------------
    | IMAGE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!image && images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBER VALIDATION
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | VALIDATE AGENT
    |--------------------------------------------------------------------------
    */

    const agentValidation = await validateAgent(agentId);

    if (agentValidation?.error) {
      return agentValidation.error;
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE IMAGES
    |--------------------------------------------------------------------------
    */

    const finalImages =
      images.length > 0
        ? images
        : image
          ? [image]
          : [];

    const coverImage = finalImages[0];

    if (!coverImage) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one property image is required.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY
    |--------------------------------------------------------------------------
    */

    const property = await prisma.property.update({
      where: {
        id,
      },

      data: {
        title,
        tag,
        price,
        location,

        category,
        propertyType,
        houseType,
        storey,

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
            role: true,
            slug: true,
            phone: true,
            profileImage: true,
            bio: true,
            facebook: true,
            messenger: true,
          },
        },
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

/*
|--------------------------------------------------------------------------
| DELETE PROPERTY
|--------------------------------------------------------------------------
*/

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    await prisma.property.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Property deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/properties error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete property.',
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

