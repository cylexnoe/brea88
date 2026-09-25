import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_UNIT_TYPE_LENGTH = 100;
const MAX_UNIT_NAME_LENGTH = 150;
const MAX_PRICE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_AREA = 1_000_000_000;
const MAX_UNIT_IMAGES = 10;
const MAX_IMAGE_URL_LENGTH = 2048;

function cleanString(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned || cleaned.length > maxLength) {
    return null;
  }

  return cleaned;
}

function cleanOptionalString(
  value: unknown,
  maxLength: number,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  return cleanString(value, maxLength);
}

function parseOptionalFloat(
  value: unknown,
): number | null | 'invalid' {
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
    number < 0 ||
    number > MAX_AREA
  ) {
    return 'invalid';
  }

  return number;
}

function parsePropertyId(
  value: string,
): number | null {
  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

async function getPropertyId(
  context: RouteContext,
): Promise<number | null> {
  const params = await context.params;

  return parsePropertyId(params.id);
}

async function propertyExists(
  propertyId: number,
): Promise<boolean> {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

  return !!property;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: 'Unauthorized.',
    },
    {
      status: 401,
    },
  );
}

function parseImages(
  value: unknown,
): string[] | 'invalid' {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  if (!Array.isArray(value)) {
    return 'invalid';
  }

  if (value.length > MAX_UNIT_IMAGES) {
    return 'invalid';
  }

  const images: string[] = [];

  for (const image of value) {
    if (typeof image !== 'string') {
      return 'invalid';
    }

    const url = image.trim();

    if (
      !url ||
      url.length > MAX_IMAGE_URL_LENGTH
    ) {
      return 'invalid';
    }

    images.push(url);
  }

  return Array.from(
    new Set(images),
  );
}

/* ============================================================
 * GET UNIT TYPES
 * ============================================================ */

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const propertyId =
      await getPropertyId(context);

    if (propertyId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        {
          status: 400,
        },
      );
    }

    const property =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        select: {
          id: true,
        },
      });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    const units =
      await prisma.propertyUnit.findMany({
        where: {
          propertyId,
        },
        orderBy: [
          {
            createdAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        include: {
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        units,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error(
      'GET /api/properties/[id]/units failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load unit types.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * CREATE UNIT TYPE
 * ============================================================ */

export async function POST(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const propertyId =
      await getPropertyId(context);

    if (propertyId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        {
          status: 400,
        },
      );
    }

    const exists =
      await propertyExists(propertyId);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        {
          status: 400,
        },
      );
    }

    const data =
      body as Record<string, unknown>;

    const unitType = cleanString(
      data.unitType,
      MAX_UNIT_TYPE_LENGTH,
    );

    const unitName =
      cleanOptionalString(
        data.unitName,
        MAX_UNIT_NAME_LENGTH,
      );

    const price = cleanString(
      data.price,
      MAX_PRICE_LENGTH,
    );

    const description =
      cleanOptionalString(
        data.description,
        MAX_DESCRIPTION_LENGTH,
      );

    const images =
      parseImages(data.images);

    if (images === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          message:
            `A Unit Type can contain a maximum of ${MAX_UNIT_IMAGES} valid photos.`,
        },
        {
          status: 400,
        },
      );
    }

    if (!unitType) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit type is required.',
        },
        {
          status: 400,
        },
      );
    }

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit price is required.',
        },
        {
          status: 400,
        },
      );
    }

    const lotArea =
      parseOptionalFloat(data.lotArea);

    const floorArea =
      parseOptionalFloat(data.floorArea);

    if (
      lotArea === 'invalid' ||
      floorArea === 'invalid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lot Area and Floor Area must be valid positive numbers.',
        },
        {
          status: 400,
        },
      );
    }

    const unit =
      await prisma.propertyUnit.create({
        data: {
          propertyId,
          unitType,
          unitName,
          price,
          lotArea,
          floorArea,
          description,

          images: {
            create: images.map(
              (url, index) => ({
                url,
                sortOrder: index,
              }),
            ),
          },
        },
        include: {
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          'Unit type added successfully.',
        unit,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      'POST /api/properties/[id]/units failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to add unit type.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * UPDATE UNIT TYPE
 * ============================================================ */

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const propertyId =
      await getPropertyId(context);

    if (propertyId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        {
          status: 400,
        },
      );
    }

    const exists =
      await propertyExists(propertyId);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        {
          status: 400,
        },
      );
    }

    const data =
      body as Record<string, unknown>;

    const unitId = Number(data.id);

    if (
      !Number.isSafeInteger(unitId) ||
      unitId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid unit ID.',
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.propertyUnit.findFirst({
        where: {
          id: unitId,
          propertyId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit type not found for this property.',
        },
        {
          status: 404,
        },
      );
    }

    const unitType = cleanString(
      data.unitType,
      MAX_UNIT_TYPE_LENGTH,
    );

    const unitName =
      cleanOptionalString(
        data.unitName,
        MAX_UNIT_NAME_LENGTH,
      );

    const price = cleanString(
      data.price,
      MAX_PRICE_LENGTH,
    );

    const description =
      cleanOptionalString(
        data.description,
        MAX_DESCRIPTION_LENGTH,
      );

    const images =
      parseImages(data.images);

    if (images === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          message:
            `A Unit Type can contain a maximum of ${MAX_UNIT_IMAGES} valid photos.`,
        },
        {
          status: 400,
        },
      );
    }

    if (!unitType) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit type is required.',
        },
        {
          status: 400,
        },
      );
    }

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit price is required.',
        },
        {
          status: 400,
        },
      );
    }

    const lotArea =
      parseOptionalFloat(data.lotArea);

    const floorArea =
      parseOptionalFloat(data.floorArea);

    if (
      lotArea === 'invalid' ||
      floorArea === 'invalid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lot Area and Floor Area must be valid positive numbers.',
        },
        {
          status: 400,
        },
      );
    }

    const unit =
    await prisma.$transaction(
      async (transaction) => {
        /*
        * Replace the Unit's image list with
        * the images currently supplied by the
        * admin dashboard.
        */
        await transaction.propertyUnitImage.deleteMany({
          where: {
            unitId: unitId,
          },
        });

        const updatedUnit =
          await transaction.propertyUnit.update({
            where: {
              id: unitId,
            },
            data: {
              unitType,
              unitName,
              price,
              lotArea,
              floorArea,
              description,

              images: {
                create: images.map(
                  (url, index) => ({
                    url,
                    sortOrder: index,
                  }),
                ),
              },
            },
            include: {
              images: {
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          });

        return updatedUnit;
      },
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Unit type updated successfully.',
        unit,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      'PUT /api/properties/[id]/units failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update unit type.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ============================================================
 * DELETE UNIT TYPE
 * ============================================================ */

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const propertyId =
      await getPropertyId(context);

    if (propertyId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        {
          status: 400,
        },
      );
    }

    const url = new URL(request.url);

    const unitId =
      Number(
        url.searchParams.get('unitId'),
      );

    if (
      !Number.isSafeInteger(unitId) ||
      unitId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid unit ID.',
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.propertyUnit.findFirst({
        where: {
          id: unitId,
          propertyId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit type not found for this property.',
        },
        {
          status: 404,
        },
      );
    }

    await prisma.propertyUnit.delete({
      where: {
        id: unitId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Unit type deleted successfully.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      'DELETE /api/properties/[id]/units failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete unit type.',
      },
      {
        status: 500,
      },
    );
  }
}