export interface Keys {
  p256dh: string;
  auth: string;
}

export interface Subscription {
  endpoint: string;
  keys: Keys;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  vibrate?: number[];
  url?: string;
  requireInteraction?: boolean;
  tag?: string;
}
