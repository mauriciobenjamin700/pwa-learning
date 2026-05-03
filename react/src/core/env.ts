import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),
  DEV_MODE: z.boolean(),
});

const DEV_MODE = import.meta.env.DEV;

// Em dev usa o proxy do Vite ('/api'); em produção, a URL real do backend.
const API_URL = DEV_MODE ? "/api" : import.meta.env.VITE_API_URL || "";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

export const env = envSchema.parse({ API_URL, VAPID_PUBLIC_KEY, DEV_MODE });
