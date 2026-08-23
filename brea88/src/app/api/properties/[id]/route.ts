import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getId(value: string): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: idParam } = await context.params;
    const id = getId(idParam);

    if (id === null) {
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
        id,
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

    const { id: idParam } = await context.params;
    const id = getId(idParam);

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    const existingProperty =
      await prisma.property.findUnique({
        where: {
          id,
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

    const body = await request.json();

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : existingProperty.title;

    const tag =
      typeof body.tag === 'string'
        ? body.tag.trim()
        : existingProperty.tag;

    const price =
      typeof body.price === 'string'
        ? body.price.trim()
        : existingProperty.price;

    const location =
      typeof body.location === 'string'
        ? body.location.trim()
        : existingProperty.location;

    const image =
      typeof body.image === 'string'
        ? body.image.trim()
        : existingProperty.image;

    const beds =
      body.beds !== undefined
        ? body.beds === null || body.beds === ''
          ? null
          : Number(body.beds)
        : existingProperty.beds;

    const baths =
      body.baths !== undefined
        ? body.baths === null || body.baths === ''
          ? null
          : Number(body.baths)
        : existingProperty.baths;

    const sqft =
      body.sqft !== undefined
        ? body.sqft === null || body.sqft === ''
          ? null
          : Number(body.sqft)
        : existingProperty.sqft;

    if (!title || !tag || !price || !location || !image) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Title, category, price, location, and image are required.',
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

    const property = await prisma.property.update({
      where: {
        id,
      },
      data: {
        title,
        tag,
        price,
        location,
        image,
        beds,
        baths,
        sqft,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully.',
      property,
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

    const { id: idParam } = await context.params;
    const id = getId(idParam);

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    const existingProperty =
      await prisma.property.findUnique({
        where: {
          id,
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

    await prisma.property.delete({
      where: {
        id,
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