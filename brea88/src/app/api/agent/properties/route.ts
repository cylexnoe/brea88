import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAgentId } from '@/lib/agent-auth';

/*
|--------------------------------------------------------------------------
| GET /api/agent/properties
|--------------------------------------------------------------------------
| Agents can only VIEW properties assigned to their own account.
|
| Agents cannot:
| - Create properties
| - Update properties
| - Delete properties
|
| Property management is restricted to Admin.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const agentId = await getCurrentAgentId();

    if (!agentId) {
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

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Agent account not found.',
        },
        {
          status: 401,
        }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your agent account is inactive.',
        },
        {
          status: 403,
        }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: 'desc',
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
    });

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
      'GET /api/agent/properties error:',
      error
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

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
| Agents cannot create properties.
|--------------------------------------------------------------------------
*/

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Agents are not allowed to create properties. Property management is restricted to administrators.',
    },
    {
      status: 403,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
| Agents cannot update properties.
|--------------------------------------------------------------------------
*/

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Agents are not allowed to update properties. Property management is restricted to administrators.',
    },
    {
      status: 403,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
| Agents cannot update properties.
|--------------------------------------------------------------------------
*/

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Agents are not allowed to update properties. Property management is restricted to administrators.',
    },
    {
      status: 403,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
| Agents cannot delete properties.
|--------------------------------------------------------------------------
*/

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Agents are not allowed to delete properties. Property management is restricted to administrators.',
    },
    {
      status: 403,
    }
  );
}