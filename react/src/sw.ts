/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: unknown;
};

precacheAndRoute(self.__WB_MANIFEST as Parameters<typeof precacheAndRoute>[0]);
cleanupOutdatedCaches();

self.addEventListener("message", (event) => {
  if ((event as ExtendableMessageEvent).data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  vibrate?: number[];
  tag?: string;
  requireInteraction?: boolean;
  data?: { url?: string };
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: PushPayload;
  try {
    data = event.data.json() as PushPayload;
  } catch {
    data = { title: "Notificação", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Nova notificação", {
      body: data.body ?? "",
      icon: data.icon ?? "/pwa-192x192.png",
      badge: data.badge ?? "/pwa-192x192.png",
      tag: data.tag ?? "default",
      requireInteraction: data.requireInteraction ?? false,
      data: data.data ?? { url: "/" },
    } as NotificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
