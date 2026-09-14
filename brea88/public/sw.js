self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'BREA 88 Realty',
      body: event.data?.text() || 'You have a new notification.',
    };
  }

  const title = data.title || 'BREA 88 Realty';

  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/img/LOGO.png',
    badge: data.badge || '/img/LOGO.png',

    data: {
      url: data.url || '/agent/dashboard',
      inquiryId: data.inquiryId || null,
    },

    vibrate: [200, 100, 200],

    tag: data.tag || 'brea88-notification',

    renotify: true,

    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationUrl =
    event.notification?.data?.url ||
    '/agent/dashboard';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ('navigate' in client) {
            client.navigate(notificationUrl);

            if ('focus' in client) {
              return client.focus();
            }

            return client;
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(notificationUrl);
        }

        return undefined;
      })
  );
});