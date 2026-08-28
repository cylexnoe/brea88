import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function parsePropertyId(value: string): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function cleanString(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function cleanOptionalString(
  value: unknown
): string | null {
  const valueString = cleanString(value);

  return valueString || null;
}

function cleanImages(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string' &&
        item.trim().length > 0
    )
    .map((item) => item.trim());
}

function parseOptionalInteger(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function parseOptionalFloat(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| GET /api/properties/[id]
|--------------------------------------------------------------------------
| PUBLIC
|
| Visitors need to be able to view individual properties.
|--------------------------------------------------------------------------
*/

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const propertyId =
      parsePropertyId(id);

    if (propertyId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    const property =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              slug: true,
              profileImage: true,
              bio: true,
              facebook: true,
              messenger: true,
            },
          },
        },
      });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error(
      'GET /api/properties/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load property.',
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/properties/[id]
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN PERMISSION CHECK
    |--------------------------------------------------------------------------
    */

    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Administrator access is required.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY ID
    |--------------------------------------------------------------------------
    */

    const { id } = await context.params;

    const propertyId =
      parsePropertyId(id);

    if (propertyId === null) {
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
    | CHECK PROPERTY EXISTS
    |--------------------------------------------------------------------------
    */

    const existingProperty =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        select: {
          id: true,
        },
      });

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PARSE REQUEST BODY
    |--------------------------------------------------------------------------
    */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
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
          message: 'Invalid property data.',
        },
        { status: 400 }
      );
    }

    const data =
      body as Record<string, unknown>;

    /*
    |--------------------------------------------------------------------------
    | BASIC INFORMATION
    |--------------------------------------------------------------------------
    */

    const title =
      cleanString(data.title);

    const tag =
      cleanString(data.tag);

    const price =
      cleanString(data.price);

    const location =
      cleanString(data.location);

    /*
    |--------------------------------------------------------------------------
    | CLASSIFICATION
    |--------------------------------------------------------------------------
    */

    const category =
      cleanOptionalString(
        data.category
      );

    const propertyType =
      cleanOptionalString(
        data.propertyType
      );

    const houseType =
      cleanOptionalString(
        data.houseType
      );

    const storey =
      cleanOptionalString(
        data.storey
      );

    /*
    |--------------------------------------------------------------------------
    | IMAGES
    |--------------------------------------------------------------------------
    */

    const image =
      cleanString(data.image);

    const images =
      cleanImages(data.images);

    /*
    |--------------------------------------------------------------------------
    | PROPERTY DETAILS
    |--------------------------------------------------------------------------
    */

    const beds =
      parseOptionalInteger(data.beds);

    const baths =
      parseOptionalInteger(data.baths);

    const sqft =
      parseOptionalFloat(data.sqft);

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELD VALIDATION
    |--------------------------------------------------------------------------
    */

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

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Property price is required.',
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
    | IMAGE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !image &&
      images.length === 0
    ) {
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
    | NUMERIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      data.beds !== undefined &&
      data.beds !== null &&
      data.beds !== '' &&
      beds === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid number of bedrooms.',
        },
        { status: 400 }
      );
    }

    if (
      data.baths !== undefined &&
      data.baths !== null &&
      data.baths !== '' &&
      baths === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid number of bathrooms.',
        },
        { status: 400 }
      );
    }

    if (
      data.sqft !== undefined &&
      data.sqft !== null &&
      data.sqft !== '' &&
      sqft === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid floor area.',
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FINAL IMAGE ARRAY
    |--------------------------------------------------------------------------
    */

    const finalImages =
      images.length > 0
        ? images
        : [image];

    const coverImage =
      finalImages[0];

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY
    |--------------------------------------------------------------------------
    */

    const updatedProperty =
      await prisma.property.update({
        where: {
          id: propertyId,
        },
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
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              slug: true,
              profileImage: true,
              bio: true,
              facebook: true,
              messenger: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        'Property updated successfully.',
      property: updatedProperty,
    });
  } catch (error) {
    console.error(
      'PUT /api/properties/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update property.',
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/properties/[id]
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN PERMISSION CHECK
    |--------------------------------------------------------------------------
    */

    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Administrator access is required.',
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY ID
    |--------------------------------------------------------------------------
    */

    const { id } = await context.params;

    const propertyId =
      parsePropertyId(id);

    if (propertyId === null) {
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
    | CHECK PROPERTY EXISTS
    |--------------------------------------------------------------------------
    */

    const existingProperty =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        select: {
          id: true,
        },
      });

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY
    |--------------------------------------------------------------------------
    */

    await prisma.property.delete({
      where: {
        id: propertyId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Property deleted successfully.',
    });
  } catch (error) {
    console.error(
      'DELETE /api/properties/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete property.',
      },
      { status: 500 }
    );
  }
}