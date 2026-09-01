import { NextResponse } from 'next/server';

import { getAgentFromSession } from '@/lib/agent-auth';

/*
|--------------------------------------------------------------------------
| GET /api/agent/me
|--------------------------------------------------------------------------
|
| Returns the currently authenticated agent.
|
| The agent ID is NEVER accepted from the browser.
| It is obtained from the signed HttpOnly agent_session cookie.
|
*/

export async function GET() {
  try {
    const agent = await getAgentFromSession();

    /*
    |--------------------------------------------------------------------------
    | NOT AUTHENTICATED
    |--------------------------------------------------------------------------
    */

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RETURN SAFE AGENT DATA
    |--------------------------------------------------------------------------
    |
    | Do NOT return passwordHash to the browser.
    |
    */

    return NextResponse.json(
      {
        success: true,
        agent: {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          role: agent.role,
          slug: agent.slug,
          phone: agent.phone,
          address: agent.address,
          profileImage: agent.profileImage,
          bio: agent.bio,
          facebook: agent.facebook,
          messenger: agent.messenger,
          isActive: agent.isActive,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('========== AGENT ME ERROR ==========');
    console.error(error);
    console.error('====================================');

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load agent information.',
      },
      {
        status: 500,
      }
    );
  }
}

