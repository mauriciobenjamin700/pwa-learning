import { env } from "@/core/env";
import { cookieGet } from "@/core/cookies";
import RequestHandler from "@/core/requests";

const baseUrl = `${env.API_URL}/webpush`;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export interface SubscribeResult {
  status: "subscribed" | "already-subscribed" | "denied" | "unsupported";
  message: string;
}

export default class WebPushManager {
  static async subscribe(): Promise<SubscribeResult> {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return {
        status: "unsupported",
        message: "Navegador não suporta notificações",
      };
    }

    const token = cookieGet("token");
    if (!token) {
      throw new Error("Token não encontrado, usuário não autenticado");
    }

    if (Notification.permission === "denied") {
      return {
        status: "denied",
        message:
          "Permissão de notificações foi bloqueada nas configurações do navegador",
      };
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { status: "denied", message: "Permissão de notificações negada" };
      }
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      return {
        status: "already-subscribed",
        message: "Já inscrito neste dispositivo",
      };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(env.VAPID_PUBLIC_KEY),
    });

    await RequestHandler.post(
      `${baseUrl}/subscription`,
      subscription.toJSON(),
      token,
    );

    return { status: "subscribed", message: "Notificações ativadas" };
  }

  static async unsubscribe(): Promise<void> {
    const token = cookieGet("token");
    if (!token) throw new Error("Token não encontrado");

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    await RequestHandler.delete(`${baseUrl}/subscription`, token);
    if (subscription) await subscription.unsubscribe();
  }

  static async isSubscribed(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  }
}
