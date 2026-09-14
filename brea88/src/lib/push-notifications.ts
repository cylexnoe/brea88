import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) {
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey) {
    throw new Error(
      'VAPID_PUBLIC_KEY is not configured.',
    );
  }

  if (!privateKey) {
    throw new Error(
      'VAPID_PRIVATE_KEY is not configured.',
    );
  }

  if (!subject) {
    throw new Error(
      'VAPID_SUBJECT is not configured.',
    );
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey,
  );

  vapidConfigured = true;
}

export interface InquiryPushData {
  inquiryId: number;
  clientName: string;
  propertyTitle?: string | null;
  isViewingRequest?: boolean;
}

export async function sendInquiryPushNotification(
  agentId: number,
  data: InquiryPushData,
) {
  configureVapid();

  const subscriptions =
    await prisma.pushSubscription.findMany({
      where: {
        agentId,
      },
    });

  if (subscriptions.length === 0) {
    return {
      sent: 0,
      removed: 0,
    };
  }

  const propertyText =
    data.propertyTitle &&
    data.propertyTitle.trim()
      ? ` about ${data.propertyTitle}`
      : '';

  const title = data.isViewingRequest
    ? 'New Site Viewing Request'
    : 'New Client Inquiry';

  const body = data.isViewingRequest
    ? `${data.clientName} requested a site viewing${propertyText}.`
    : `${data.clientName} sent you a new inquiry${propertyText}.`;

  const payload = JSON.stringify({
    title,
    body,

    icon: '/img/LOGO.png',
    badge: '/img/LOGO.png',

    url: `/agent/dashboard?inquiry=${data.inquiryId}`,

    inquiryId: data.inquiryId,

    tag: `inquiry-${data.inquiryId}`,
  });

  let sent = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,

          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      );

      sent += 1;
    } catch (error: unknown) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof (
          error as { statusCode?: unknown }
        ).statusCode === 'number'
          ? (error as { statusCode: number })
              .statusCode
          : null;

      /*
       * 404 and 410 mean the browser subscription
       * is no longer valid.
       *
       * Remove it so future notifications don't
       * repeatedly fail.
       */
      if (
        statusCode === 404 ||
        statusCode === 410
      ) {
        try {
          await prisma.pushSubscription.delete({
            where: {
              id: subscription.id,
            },
          });

          removed += 1;
        } catch (deleteError) {
          console.error(
            'Failed to remove expired push subscription:',
            deleteError,
          );
        }

        continue;
      }

      console.error(
        `Failed to send push notification to subscription ${subscription.id}:`,
        error,
      );
    }
  }

  return {
    sent,
    removed,
  };
}