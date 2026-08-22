import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get properties here

    return NextResponse.json({
      success: true,
      properties: [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch properties',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create property here

    return NextResponse.json(
      {
        success: true,
        property: body,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create property',
      },
      { status: 500 }
    );
  }
}