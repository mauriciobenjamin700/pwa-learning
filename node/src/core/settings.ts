import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} é obrigatória`);
  }
  return value;
}

const settings = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  VAPID_EMAIL: required("VAPID_EMAIL"),
  VAPID_PUBLIC_KEY: required("VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: required("VAPID_PRIVATE_KEY"),
  WEBPUSH_API_KEY: required("WEBPUSH_API_KEY"),
  DB_PATH: process.env.DB_PATH ?? "./data/subscriptions.db",
} as const;

export default settings;
