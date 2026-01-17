/// <reference lib="webworker" />

/* =====================================================
   TIPAGEM OBRIGATÓRIA PARA WORKBOX (injectManifest)
===================================================== */
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

/* =====================================================
   PONTO DE INJEÇÃO DO MANIFEST (OBRIGATÓRIO)
===================================================== */
self.__WB_MANIFEST;

/* =====================================================
   PUSH NOTIFICATIONS
===================================================== */
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data: {
    title: string;
    body: string;
    icon: string;
    badge: string;
    data?: any;
  } = {
    title: 'PromissóriasApp',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title ?? data.title,
        body: payload.body ?? payload.message ?? data.body,
        icon: payload.icon ?? data.icon,
        badge: data.badge,
        data: payload.data ?? {},
      };
    } catch (err) {
      console.error('Erro ao parsear push:', err);
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      tag: 'promissoria-notification',
      requireInteraction: true,
      data: data.data,
      actions: [
        { action: 'open', title: 'Abrir App' },
        { action: 'close', title: 'Fechar' },
      ],
    })
  );
});

/* =====================================================
   CLICK NA NOTIFICAÇÃO
===================================================== */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

/* =====================================================
   CICLO DE VIDA DO SERVICE WORKER
===================================================== */
self.addEventListener('install', () => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});
