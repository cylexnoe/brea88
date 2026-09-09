import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    // CRON_SECRET must exist.
    if (!cronSecret) {
      console.error('CRON_SECRET is not configured.');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error.',
        },
        { status: 500 }
      );
    }

    // Vercel Cron sends the secret as:
    // Authorization: Bearer <CRON_SECRET>
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    // 30 days before the current time.
    const cutoffDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const deleted = await prisma.inquiry.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `Inquiry cleanup completed. Deleted ${deleted.count} inquiries older than 30 days.`
    );

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      message: `${deleted.count} ${
        deleted.count === 1 ? 'inquiry' : 'inquiries'
      } deleted.`,
    });
  } catch (error) {
    console.error('Inquiry cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up old inquiries.',
      },
      { status: 500 }
    );
  }
}