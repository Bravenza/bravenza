// Custom Service Worker for Web Push Notifications
// This runs alongside the VitePWA-generated service worker

self.addEventListener("push", (event) => {
  console.log("[SW-PUSH] Push event received");

  let data = { title: "BRAVENZA", body: "Nova notificação" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-192x192.png",
    tag: data.tag || "bravenza-push",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/app/notificacoes",
      ...data.data,
    },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Fechar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW-PUSH] Notification click:", event.action);

  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/app/notificacoes";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[SW-PUSH] Notification closed");
});

// Listen for messages from the main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
