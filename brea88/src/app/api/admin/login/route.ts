// src/app/api/admin/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();


    const VALID_USERNAME = 'admin';
    const VALID_PASSWORD = 'Secure_Password_88!'; 

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const response = NextResponse.json(
        { success: true, message: 'Authentication Successful' },
        { status: 200 }
      );

      // Set a secure session cookie
      response.cookies.set('admin_session', 'authenticated_token_88_realty', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 2, // 2 hour session validity
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials provided.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error processing authorization' },
      { status: 500 }
    );
  }
}