import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
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

    return NextResponse.json(property);
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

export async function PUT(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
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

    const images = Array.isArray(body.images)
      ? body.images.filter(
          (item: unknown): item is string =>
            typeof item === 'string' &&
            item.trim().length > 0
        )
      : [];

    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : '';

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

    if (!title || !tag || !price || !location) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Title, category, price, and location are required.',
        },
        { status: 400 }
      );
    }

    if (images.length === 0 && !image) {
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
        : [image];

    const updatedProperty =
      await prisma.property.update({
        where: {
          id: propertyId,
        },
        data: {
          title,
          tag,
          price,
          location,
          image: finalImages[0],
          images: finalImages,
          beds,
          baths,
          sqft,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully.',
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
        message: 'Failed to update property.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId)) {
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
        id: propertyId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully.',
    });
  } catch (error) {
    console.error(
      'DELETE /api/properties/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete property.',
      },
      { status: 500 }
    );
  }
}
