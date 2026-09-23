import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isSafeHttpUrl } from '@/lib/security';

const ALLOWED_CATEGORIES = new Set([
  'House & Lot',
  'Condominiums',
  'For Rent',
  'For Sale',
  'Brokerage',
]);

const ALLOWED_TAGS = new Set([
  'All',
  'Residential',
  'Commercial',
  'Investment',
  'For Rent',
  'For Sale',
]);

const MAX_IMAGES = 20;

function cleanString(
  value: unknown,
  max: number,
): string {
  if (typeof value !== 'string') {
    return '';
  }

  const result = value.trim();

  return result && result.length <= max
    ? result
    : '';
}

function normalizeTag(
  value: unknown,
): string {
  const cleaned = cleanString(
    value,
    30,
  );

  if (!cleaned) {
    return '';
  }

  /*
   * Brokerage is a CATEGORY only.
   *
   * If an old property still contains
   * Brokerage as its Listing Tag,
   * convert it to For Sale.
   */
  if (
    cleaned.toLowerCase() ===
    'brokerage'
  ) {
    return 'For Sale';
  }

  const matchedTag =
    Array.from(ALLOWED_TAGS).find(
      (allowedTag) =>
        allowedTag.toLowerCase() ===
        cleaned.toLowerCase(),
    );

  return matchedTag || '';
}

function normalizeCategory(
  value: unknown,
): string {
  const cleaned = cleanString(
    value,
    100,
  );

  if (!cleaned) {
    return '';
  }

  const matchedCategory =
    Array.from(
      ALLOWED_CATEGORIES,
    ).find(
      (allowedCategory) =>
        allowedCategory.toLowerCase() ===
        cleaned.toLowerCase(),
    );

  return matchedCategory || '';
}

function cleanOptionalUrl(
  value: unknown,
): string {
  const result = cleanString(
    value,
    2048,
  );

  if (!result) {
    return '';
  }

  return isSafeHttpUrl(result)
    ? result
    : '';
}

function cleanImages(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter((item) =>
      isSafeHttpUrl(item),
    )
    .slice(0, MAX_IMAGES);
}

function cleanBankFinancing(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === 'string',
        )
        .map((item) => item.trim())
        .filter(
          (item) =>
            item.length > 0 &&
            item.length <= 100,
        ),
    ),
  ).slice(0, 20);
}

/**
 * Per Month rules:
 *
 * House & Lot     -> allowed
 * Condominiums    -> allowed
 * For Sale        -> allowed
 * For Rent        -> always null
 * Brokerage       -> always null
 */
function cleanPerMonth(
  value: unknown,
  category: string,
  propertyType: string,
): string | null {
  const normalizedCategory =
    category.trim().toLowerCase();

  const normalizedPropertyType =
    propertyType.trim().toLowerCase();

  const isForRent =
    normalizedCategory === 'for rent' ||
    normalizedPropertyType === 'for rent' ||
    normalizedPropertyType.includes(
      'for rent',
    );

  const isBrokerage =
    normalizedCategory === 'brokerage' ||
    normalizedPropertyType ===
      'brokerage' ||
    normalizedPropertyType.includes(
      'brokerage',
    );

  if (
    isForRent ||
    isBrokerage
  ) {
    return null;
  }

  const isHouseAndLot =
    normalizedCategory ===
      'house & lot' ||
    normalizedPropertyType ===
      'house & lot' ||
    normalizedPropertyType.includes(
      'house & lot',
    );

  const isCondominium =
    normalizedCategory ===
      'condominiums' ||
    normalizedCategory ===
      'condominium' ||
    normalizedPropertyType ===
      'condominiums' ||
    normalizedPropertyType ===
      'condominium' ||
    normalizedPropertyType.includes(
      'condominium',
    );

  const isForSale =
    normalizedCategory === 'for sale' ||
    normalizedPropertyType ===
      'for sale';

  if (
    isHouseAndLot ||
    isCondominium ||
    isForSale
  ) {
    return (
      cleanString(
        value,
        100,
      ) || null
    );
  }

  return null;
}

function optionalNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= 0
    ? number
    : null;
}

function validateMeasurements(
  data: Record<string, unknown>,
  beds: number | null,
  baths: number | null,
  sqft: number | null,
  lotArea: number | null,
) {
  return !(
    (data.beds !== undefined &&
      data.beds !== null &&
      data.beds !== '' &&
      beds === null) ||
    (data.baths !== undefined &&
      data.baths !== null &&
      data.baths !== '' &&
      baths === null) ||
    (data.sqft !== undefined &&
      data.sqft !== null &&
      data.sqft !== '' &&
      sqft === null) ||
    (data.lotArea !== undefined &&
      data.lotArea !== null &&
      data.lotArea !== '' &&
      lotArea === null)
  );
}

function getPropertyData(
  data: Record<string, unknown>,
) {
  const title = cleanString(
    data.title,
    200,
  );

  /*
   * IMPORTANT:
   *
   * Normalize the Listing Tag here.
   *
   * Old:
   * Brokerage
   *
   * Becomes:
   * For Sale
   */
  const tag = normalizeTag(
    data.tag,
  );

  const location = cleanString(
    data.location,
    300,
  );

  const price = cleanString(
    data.price,
    100,
  );

  /*
   * Normalize Category.
   */
  const category =
    normalizeCategory(
      data.category,
    );

  const propertyType = cleanString(
    data.propertyType,
    100,
  );

  const houseType = cleanString(
    data.houseType,
    100,
  );

  const storey = cleanString(
    data.storey,
    30,
  );

  const developer = cleanString(
    data.developer,
    200,
  );

  const description = cleanString(
    data.description,
    10000,
  );

  const totalcp = cleanString(
    data.totalcp,
    100,
  );

  const videoUrl =
    cleanOptionalUrl(
      data.videoUrl,
    );

  const bankFinancing =
    cleanBankFinancing(
      data.bankFinancing,
    );

  const images = cleanImages(
    data.images,
  );

  const singleImage = cleanString(
    data.image,
    2048,
  );

  const image =
    singleImage &&
    isSafeHttpUrl(singleImage)
      ? singleImage
      : '';

  const beds = optionalNumber(
    data.beds,
  );

  const baths = optionalNumber(
    data.baths,
  );

  const sqft = optionalNumber(
    data.sqft,
  );

  const lotArea = optionalNumber(
    data.lotArea,
  );

  /*
   * IMPORTANT:
   * Per Month is normalized on the server.
   */
  const perMonth = cleanPerMonth(
    data.perMonth,
    category,
    propertyType,
  );

  return {
    title,
    tag,
    location,
    price,
    perMonth,
    category,
    propertyType,
    houseType,
    storey,
    developer,
    description,
    totalcp,
    videoUrl,
    bankFinancing,
    images,
    image,
    beds,
    baths,
    sqft,
    lotArea,
  };
}

function validatePropertyData(
  data: ReturnType<
    typeof getPropertyData
  >,
  raw: Record<string, unknown>,
) {
  if (
    !data.title ||
    !data.tag ||
    !data.location ||
    !data.price
  ) {
    return (
      'Title, tag, price, and location are required.'
    );
  }

  /*
   * LISTING TAG
   *
   * Allowed:
   * All
   * Residential
   * Commercial
   * Investment
   * For Rent
   * For Sale
   *
   * Brokerage is NOT a tag.
   */
  if (!ALLOWED_TAGS.has(data.tag)) {
    return 'Invalid property tag.';
  }

  /*
   * CATEGORY
   *
   * Allowed:
   * House & Lot
   * Condominiums
   * For Rent
   * For Sale
   * Brokerage
   */
  if (
    data.category &&
    !ALLOWED_CATEGORIES.has(
      data.category,
    )
  ) {
    return 'Invalid property category.';
  }

  if (
    !validateMeasurements(
      raw,
      data.beds,
      data.baths,
      data.sqft,
      data.lotArea,
    )
  ) {
    return 'Invalid property measurements.';
  }

  if (
    raw.videoUrl !== undefined &&
    raw.videoUrl !== null &&
    raw.videoUrl !== '' &&
    !data.videoUrl
  ) {
    return 'Property video URL must be a valid HTTPS URL.';
  }

  return null;
}

export async function GET() {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
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

    const properties =
      await prisma.property.findMany({
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
      'GET /admin/api/properties failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch properties.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
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

  try {
    const body: unknown =
      await request
        .json()
        .catch(() => null);

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
        {
          status: 400,
        },
      );
    }

    const raw =
      body as Record<
        string,
        unknown
      >;

    const data =
      getPropertyData(raw);

    const validationError =
      validatePropertyData(
        data,
        raw,
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        {
          status: 400,
        },
      );
    }

    const finalImages =
      data.images.length > 0
        ? data.images
        : data.image
          ? [data.image]
          : [];

    if (!finalImages.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one valid property image is required.',
        },
        {
          status: 400,
        },
      );
    }

    const property =
      await prisma.property.create({
        data: {
          title:
            data.title,

          /*
           * Always save the normalized tag.
           */
          tag:
            data.tag,

          category:
            data.category,

          propertyType:
            data.propertyType,

          houseType:
            data.houseType,

          storey:
            data.storey,

          price:
            data.price,

          perMonth:
            data.perMonth,

          location:
            data.location,

          image:
            finalImages[0],

          images:
            finalImages,

          beds:
            data.beds === null
              ? null
              : Math.floor(
                  data.beds,
                ),

          baths:
            data.baths === null
              ? null
              : Math.floor(
                  data.baths,
                ),

          sqft:
            data.sqft,

          lotArea:
            data.lotArea,

          developer:
            data.developer,

          bankFinancing:
            data.bankFinancing,

          description:
            data.description,

          videoUrl:
            data.videoUrl,

          totalcp:
            data.totalcp,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          'Property saved successfully.',
        property,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      'POST /admin/api/properties failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create property.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: Request,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
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

  try {
    const body: unknown =
      await request
        .json()
        .catch(() => null);

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
        {
          status: 400,
        },
      );
    }

    const raw =
      body as Record<
        string,
        unknown
      >;

    const id =
      Number(raw.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid property ID is required.',
        },
        {
          status: 400,
        },
      );
    }

    const data =
      getPropertyData(raw);

    const validationError =
      validatePropertyData(
        data,
        raw,
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        {
          status: 400,
        },
      );
    }

    const finalImages =
      data.images.length > 0
        ? data.images
        : data.image
          ? [data.image]
          : [];

    if (!finalImages.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one valid property image is required.',
        },
        {
          status: 400,
        },
      );
    }

    const property =
      await prisma.property.update({
        where: {
          id,
        },

        data: {
          title:
            data.title,

          /*
           * Always save the normalized tag.
           */
          tag:
            data.tag,

          category:
            data.category,

          propertyType:
            data.propertyType,

          houseType:
            data.houseType,

          storey:
            data.storey,

          price:
            data.price,

          perMonth:
            data.perMonth,

          location:
            data.location,

          image:
            finalImages[0],

          images:
            finalImages,

          beds:
            data.beds === null
              ? null
              : Math.floor(
                  data.beds,
                ),

          baths:
            data.baths === null
              ? null
              : Math.floor(
                  data.baths,
                ),

          sqft:
            data.sqft,

          lotArea:
            data.lotArea,

          developer:
            data.developer,

          bankFinancing:
            data.bankFinancing,

          description:
            data.description,

          videoUrl:
            data.videoUrl,

          totalcp:
            data.totalcp,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        'Property updated successfully.',
      property,
    });
  } catch (error) {
    console.error(
      'PUT /admin/api/properties failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update property.',
      },
      {
        status: 500,
      },
    );
  }
}