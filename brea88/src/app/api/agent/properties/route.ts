import { NextResponse } from 'next/server';

import {getAgentFromSession,} from '@/lib/agent-auth';

import { prisma } from '@/lib/prisma';

/*
|--------------------------------------------------------------------------
| GET /api/agent/properties
|--------------------------------------------------------------------------
|
| Returns properties assigned to the currently authenticated agent.
|
| SECURITY:
|
| The browser does NOT provide agentId.
|
| We get the authenticated agent from the signed HttpOnly
| agent_session cookie and use that ID for the database query.
|
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATE AGENT
    |--------------------------------------------------------------------------
    */

    const agent = await getAgentFromSession();

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
    | FIND ASSIGNED PROPERTIES
    |--------------------------------------------------------------------------
    |
    | Only properties where agentId matches the authenticated
    | agent's ID will be returned.
    |
    */

    const properties =
      await prisma.property.findMany({
        where: {
          agentId: agent.id,
        },

        select: {
          id: true,
          title: true,
          tag: true,
          price: true,
          location: true,
          image: true,
          images: true,
          beds: true,
          baths: true,
          sqft: true,
          agentId: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        properties,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      '========== AGENT PROPERTIES ERROR =========='
    );

    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    console.error(
      '============================================'
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load assigned properties.',
      },
      {
        status: 500,
      }
    );
  }
}

