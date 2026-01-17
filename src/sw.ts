/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
  let payload = {
    title: 'PromissóriasApp',
    body: 'Nova notificação',
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'promissoria',
      renotify: true,
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          client.focus();
          return true;
        }
        return false;
      });

      if (!hadWindow && clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
