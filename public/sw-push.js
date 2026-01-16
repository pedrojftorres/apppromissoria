/// <reference lib="webworker" />

// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {
    title: 'PromissóriasApp',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: data.badge,
        data: payload.data || {}
      };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
    if (event.data) {
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
      actions: [
        { action: 'open', title: 'Abrir App' },
        { action: 'close', title: 'Fechar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Keep service worker active
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});
