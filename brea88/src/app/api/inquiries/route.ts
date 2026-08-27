import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      message,
      propertyId,
    } = body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (
      !name ||
      !email ||
      !phone ||
      !message ||
      !propertyId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Name, email, phone, message, and property are required.',
        },
        { status: 400 }
      );
    }

    const parsedPropertyId = Number(propertyId);

    if (
      !Number.isInteger(parsedPropertyId) ||
      parsedPropertyId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid property ID.',
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // FIND PROPERTY + ASSIGNED AGENT
    // -----------------------------

    const property = await prisma.property.findUnique({
      where: {
        id: parsedPropertyId,
      },
      include: {
        agent: true,
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

    // -----------------------------
    // CREATE INQUIRY
    // -----------------------------

    const inquiry = await prisma.inquiry.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone).trim(),
        message: String(message).trim(),

        propertyId: property.id,

        // IMPORTANT:
        // Agent comes from the DATABASE property,
        // not from the browser.
        agentId: property.agentId,

        status: 'New',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry submitted successfully.',
        inquiry: {
          id: inquiry.id,
          propertyId: inquiry.propertyId,
          agentId: inquiry.agentId,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE INQUIRY ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Something went wrong while submitting your inquiry.',
      },
      { status: 500 }
    );
  }
}