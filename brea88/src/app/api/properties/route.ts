// src/app/api/properties/route.ts
import { NextResponse } from 'next/server';
import { addProperty, PROPERTIES } from '../../data';

// GET method to retrieve listings
export async function GET() {
  return NextResponse.json(PROPERTIES);
}

// POST method to process new admin entries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic structural validation
    if (!body.title || !body.price || !body.location || !body.tag || !body.image) {
      return NextResponse.json({ error: 'Missing required property metrics' }, { status: 400 });
    }

    const savedProperty = addProperty({
      title: body.title,
      tag: body.tag,
      price: body.price,
      location: body.location,
      image: body.image,
      beds: body.beds ? Number(body.beds) : undefined,
      baths: body.baths ? Number(body.baths) : undefined,
      sqft: Number(body.sqft) || 0,
    });

    return NextResponse.json({ success: true, data: savedProperty }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Routing Error' }, { status: 500 });
  }
}