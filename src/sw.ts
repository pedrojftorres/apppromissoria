/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

// Workbox injecta o precache aqui
precacheAndRoute(self.__WB_MANIFEST);

// PUSH HANDLER
self.addEventListener("push", (event: PushEvent) => {
  let data: any = {
    title: "PromissóriasApp",
    body: "Nova notificação",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: {},
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: data.badge,
        data: payload.data || {},
      };
    }
  } catch {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      tag: "promissoria-notification",
      requireInteraction: true,
      data: data.data,
      actions: [
        { action: "open", title: "Abrir App" },
        { action: "close", title: "Fechar" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === "close") return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow("/") : undefined;
    })
  );
});

// lifecycle
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
