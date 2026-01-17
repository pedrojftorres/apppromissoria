/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// 🔴 OBRIGATÓRIO PARA injectManifest
precacheAndRoute(self.__WB_MANIFEST)

// ===============================
// PUSH NOTIFICATIONS
// ===============================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received')

  let data = {
    title: 'PromissóriasApp',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        title: payload.title ?? data.title,
        body: payload.body ?? payload.message ?? data.body,
        icon: payload.icon ?? data.icon,
        badge: data.badge,
        data: payload.data ?? {},
      }
    } catch {
      data.body = event.data.text()
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
    })
  )
})

// ===============================
// CLICK NA NOTIFICAÇÃO
// ===============================

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})

// ===============================
// LIFECYCLE
// ===============================

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
