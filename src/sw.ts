/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

// 🔴 OBRIGATÓRIO PARA injectManifest
self.__WB_MANIFEST;

self.addEventListener("push", (event) => {
  let data = {
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
        ...data,
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        data: payload.data || {},
      };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: "promissoria-notification",
      requireInteraction: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
