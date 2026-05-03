import webpush from "web-push";
import settings from "@/core/settings";
import SubscriptionRepository, {
  SubscriptionRow,
} from "@/repositories/subscription.repository";
import { NotificationData } from "@/types/notification";

webpush.setVapidDetails(
  `mailto:${settings.VAPID_EMAIL}`,
  settings.VAPID_PUBLIC_KEY,
  settings.VAPID_PRIVATE_KEY,
);

const PUSH_OPTIONS = { TTL: 60, timeout: 10_000 };

function buildPayload(data: NotificationData): string {
  return JSON.stringify({
    title: data.title,
    body: data.body,
    icon: data.icon ?? "/pwa-192x192.png",
    badge: data.badge ?? "/pwa-192x192.png",
    image: data.image,
    vibrate: data.vibrate ?? [100, 50, 100],
    requireInteraction: data.requireInteraction ?? false,
    tag: data.tag ?? "default",
    data: { url: data.url ?? "/" },
  });
}

async function sendToRow(
  row: SubscriptionRow,
  payload: string,
): Promise<boolean> {
  const subscription = {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
  try {
    await webpush.sendNotification(subscription, payload, PUSH_OPTIONS);
    return true;
  } catch (error) {
    const e = error as { statusCode?: number; code?: string };
    if (e.statusCode === 404 || e.statusCode === 410) {
      await SubscriptionRepository.deleteByEndpoint(row.endpoint);
    } else if (e.code === "ETIMEDOUT" || e.code === "ENETUNREACH") {
      console.warn("Timeout/rede ao enviar push:", e.code, row.endpoint);
    } else {
      console.error("Erro inesperado ao enviar push:", error);
    }
    return false;
  }
}

export default class WebPushService {
  static async sendToUser(
    user_id: string,
    data: NotificationData,
  ): Promise<{ sent: number; failed: number }> {
    const rows = await SubscriptionRepository.listByUser(user_id);
    if (rows.length === 0) return { sent: 0, failed: 0 };

    const payload = buildPayload(data);
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      (await sendToRow(row, payload)) ? sent++ : failed++;
    }
    return { sent, failed };
  }

  static async broadcast(
    data: NotificationData,
  ): Promise<{ sent: number; failed: number }> {
    const rows = await SubscriptionRepository.listAll();
    if (rows.length === 0) return { sent: 0, failed: 0 };

    const payload = buildPayload(data);
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      (await sendToRow(row, payload)) ? sent++ : failed++;
    }
    return { sent, failed };
  }
}
