import { NextResponse } from 'next/server';

/*
|--------------------------------------------------------------------------
| POST /api/agent/logout
|--------------------------------------------------------------------------
|
| Clears the authenticated agent session cookie.
|
*/

export async function POST() {
  try {
    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful.',
      },
      {
        status: 200,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | CLEAR AGENT SESSION
    |--------------------------------------------------------------------------
    */

    response.cookies.set({
      name: 'agent_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      '========== AGENT LOGOUT ERROR =========='
    );

    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    console.error(
      '========================================'
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to logout.',
      },
      {
        status: 500,
      }
    );
  }
}

