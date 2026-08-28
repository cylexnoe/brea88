import { NextResponse } from 'next/server';
import {
  getAgentFromSession,
} from '@/lib/agent-auth';
import { prisma } from '@/lib/prisma';

/*
|--------------------------------------------------------------------------
| GET /api/agent/me
|--------------------------------------------------------------------------
|
| Returns the currently authenticated agent's safe profile information.
|
| Security:
| - Requires a valid agent session.
| - Requires the agent account to be active.
| - Explicitly selects allowed fields.
| - NEVER returns passwordHash.
|
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const agent =
      await getAgentFromSession();

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
    | LOAD SAFE PROFILE
    |--------------------------------------------------------------------------
    |
    | Do not return the complete Prisma Agent object.
    |
    | In particular, passwordHash must never be sent to the browser.
    |
    */

    const profile =
      await prisma.agent.findUnique({
        where: {
          id: agent.id,
        },

        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          slug: true,
          phone: true,
          address: true,
          profileImage: true,
          bio: true,
          facebook: true,
          messenger: true,
          isActive: true,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | VERIFY ACCOUNT STILL EXISTS AND IS ACTIVE
    |--------------------------------------------------------------------------
    */

    if (
      !profile ||
      !profile.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Agent account not found.',
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        agent: profile,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | SERVER ERROR
    |--------------------------------------------------------------------------
    |
    | Do not expose internal database or authentication errors to the client.
    |
    */

    console.error(
      'GET /api/agent/me error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load agent profile.',
      },
      {
        status: 500,
      }
    );
  }
}
