import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isOnline(lastSeen: Date | null): boolean {
  if (!lastSeen) {
    return false;
  }

  const difference =
    Date.now() - lastSeen.getTime();

  return (
    difference >= 0 &&
    difference <= 5 * 60 * 1000
  );
}

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        isActive: true,
        role: {
          in: ['Agent', 'Broker'],
        },
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        slug: true,
        profileImage: true,
        lastSeen: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    /*
     * Put online Agents/Brokers first.
     * Offline Agents/Brokers remain selectable.
     */
    const sortedAgents = [...agents].sort(
      (a, b) => {
        const aOnline = isOnline(a.lastSeen);
        const bOnline = isOnline(b.lastSeen);

        if (aOnline && !bOnline) {
          return -1;
        }

        if (!aOnline && bOnline) {
          return 1;
        }

        return a.fullName.localeCompare(
          b.fullName
        );
      }
    );

    return NextResponse.json(
      sortedAgents,
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      'Failed to load public agents:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to load available agents.',
      },
      {
        status: 500,
      }
    );
  }
}