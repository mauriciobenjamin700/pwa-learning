# Frontend — React + Vite + TypeScript PWA

Aplicação que é instalável como app nativo, recebe Web Push (mesmo fechada) e SSE em tempo real (aberta). Combina o melhor de [alofans-frontend](../../companies/andall/alofans/alofans-react/) (zod env, `injectManifest`, `WebPushManager`) e [transport-frontend](../../companies/tempest/transport/transport-react/) (`PWAProvider`, `PWAUpdateProvider`, `SSEProvider` com heartbeat + reconnect).

## Estrutura final

```text
react/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env.example
├── public/
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── pwa-maskable-192x192.png
│   ├── pwa-maskable-512x512.png
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── sw.ts                          ← service worker custom (TS!)
│   ├── core/
│   │   ├── env.ts                     ← zod schema
│   │   ├── cookies.ts
│   │   ├── storage.ts
│   │   ├── constants/
│   │   │   ├── routes.ts
│   │   │   └── query-keys.ts
│   │   └── requests/
│   │       └── index.ts               ← RequestHandler class
│   ├── services/
│   │   ├── webpush.ts                 ← WebPushManager
│   │   └── user.ts                    ← exemplo de service de domínio
│   ├── store/
│   │   ├── useTokenStore.ts
│   │   ├── useUserStore.ts
│   │   └── useSSEStore.ts
│   ├── providers/
│   │   ├── PWAProvider.tsx            ← install prompt
│   │   ├── PWAUpdateProvider.tsx      ← auto-update
│   │   ├── SSEProvider.tsx            ← real-time channel
│   │   └── queryClientProvider.tsx
│   ├── components/
│   │   └── Pwa/
│   │       ├── InstallButton.tsx
│   │       ├── UpdateButton.tsx
│   │       └── NotifyToggle.tsx
│   ├── pages/
│   │   ├── Home/index.tsx
│   │   └── Login/index.tsx
│   ├── routers/
│   │   └── index.tsx
│   ├── middlewares/
│   │   └── PrivateRoute.tsx
│   ├── hooks/
│   │   └── useUserIsSubscribed.ts
│   ├── types/
│   │   ├── user.d.ts
│   │   └── pwa.d.ts
│   ├── utils/
│   │   └── localStorage.ts
│   └── vite-env.d.ts
└── tsconfig.node.json
```

## Passo 1: Setup

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend

# Core PWA
npm install -D vite-plugin-pwa workbox-precaching

# Roteamento + estado + dados
npm install react-router zustand @tanstack/react-query

# Cookies + validação + JWT (para futura integração)
npm install js-cookie zod
npm install -D @types/js-cookie
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

`tsconfig.app.json` precisa do mesmo paths e da lib `WebWorker` (para o sw.ts):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

## Passo 2: Variáveis de ambiente (zod)

`.env.example`:

```env
VITE_API_URL=http://localhost:3001
VITE_VAPID_PUBLIC_KEY=BKxxx...
```

`src/core/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),
  DEV_MODE: z.boolean(),
});

const DEV_MODE = import.meta.env.DEV;

// Em dev usa o proxy do Vite ('/api'); em produção, a URL real.
const API_URL = DEV_MODE
  ? "/api"
  : import.meta.env.VITE_API_URL || "";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

export const env = envSchema.parse({ API_URL, VAPID_PUBLIC_KEY, DEV_MODE });
```

**Por que validar no boot:** se faltar `VITE_VAPID_PUBLIC_KEY`, o app falha imediatamente — em vez de descobrir só na hora que o usuário tentar ativar notificações.

## Passo 3: vite.config.ts com `injectManifest`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  esbuild: {
    pure: process.env.NODE_ENV === "production"
      ? ["console.log", "console.info", "console.debug", "console.trace"]
      : [],
    drop: process.env.NODE_ENV === "production" ? ["debugger"] : [],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      base: "/",
      scope: "/",
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      injectManifest: {
        swSrc: "src/sw.ts",
        swDest: "dist/sw.js",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Meu PWA Aprendizado",
        short_name: "MeuPWA",
        description: "PWA com Web Push e SSE",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#053fb4",
        background_color: "#ffffff",
        lang: "pt-br",
        id: "meu-pwa",
        dir: "ltr",
        categories: ["productivity"],
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
});
```

**Diferenças críticas vs o `pwa-learning` original:**

| Antes (pwa-learning) | Agora |
| --- | --- |
| `strategies: "generateSW"` | `strategies: "injectManifest"` |
| `public/sw.js` separado, copiado via Makefile | `src/sw.ts` único, gerado pelo plugin |
| Conflito SW gerado vs SW custom | Workbox precache + push handler num só arquivo |
| `registerType: "autoUpdate"` (silencioso) | `registerType: "prompt"` (avisa o usuário) |

**Proxy `/api`:** em dev, o frontend conversa com `http://localhost:5173/api/...` que o Vite redireciona para `http://localhost:3001`. Resolve CORS sem mexer no backend.

## Passo 4: Service Worker

`src/sw.ts`:

```ts
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: unknown;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Espera comando do app para atualizar
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
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
    data = event.data.json();
  } catch {
    data = { title: "Notificação", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova notificação", {
      body: data.body ?? "",
      icon: data.icon ?? "/pwa-192x192.png",
      badge: data.badge ?? "/pwa-192x192.png",
      image: data.image,
      vibrate: data.vibrate ?? [100, 50, 100],
      tag: data.tag ?? "default",
      requireInteraction: data.requireInteraction ?? false,
      data: data.data ?? { url: "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
```

**Por que TS no SW:** type checking dos eventos (`PushEvent`, `NotificationEvent`), autocompletar para `self.registration`, e o lib `WebWorker` no tsconfig garante que `ServiceWorkerGlobalScope` exista. O `injectManifest` compila isso para `dist/sw.js`.

## Passo 5: Storage e cookies

`src/core/cookies.ts`:

```ts
import Cookies from "js-cookie";

const SEVEN_DAYS = 7;

export const cookieGet = (name: string): string | undefined =>
  Cookies.get(name);

export const cookieSet = (name: string, value: string, days = SEVEN_DAYS): void => {
  Cookies.set(name, value, { expires: days, sameSite: "lax", secure: false });
};

export const cookieDelete = (name: string): void => {
  Cookies.remove(name);
};
```

**Em produção, troque `secure: false` por `secure: true` e considere usar httpOnly via Set-Cookie do backend.**

`src/utils/localStorage.ts` — pattern do `transport-frontend dev`:

```ts
export const clearStorageWhiteList: string[] = [
  "user-preferences",
  "theme-storage",
];

export function clearStorageExcept(whitelist: string[]): void {
  const keysToKeep = new Set(whitelist);
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.has(key)) toRemove.push(key);
  }
  for (const key of toRemove) localStorage.removeItem(key);
  sessionStorage.clear();
}
```

**Por que whitelist:** preferências e tema do usuário não devem morrer no logout. Tudo o que for sensível (token cache, dados de chat, etc.) some.

## Passo 6: RequestHandler

`src/core/requests/index.ts`:

```ts
type Body = object | undefined;

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return (data as { detail?: string }).detail ?? `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(token?: string): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeaders(token) };
}

export default class RequestHandler {
  static async get<T>(url: string, token?: string): Promise<T> {
    const res = await fetch(url, { headers: jsonHeaders(token) });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async post<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async put<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async patch<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async delete<T>(url: string, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: jsonHeaders(token),
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async getStream(
    url: string,
    token?: string,
    options?: { signal?: AbortSignal },
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        ...authHeaders(token),
      },
      signal: options?.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`SSE: status ${res.status}`);
    }
    return res.body;
  }
}
```

**Por que `getStream`:** o `EventSource` nativo do browser **não aceita header `Authorization`** — daí o pattern dos dois projetos de produção: `fetch` manual + parsing linha-a-linha do `text/event-stream`.

## Passo 7: WebPushManager

`src/services/webpush.ts`:

```ts
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
      return { status: "unsupported", message: "Navegador não suporta notificações" };
    }

    const token = cookieGet("token");
    if (!token) {
      throw new Error("Token não encontrado, usuário não autenticado");
    }

    if (Notification.permission === "denied") {
      return {
        status: "denied",
        message: "Permissão de notificações foi bloqueada nas configurações do navegador",
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
      return { status: "already-subscribed", message: "Já inscrito neste dispositivo" };
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
```

**Pontos críticos vs o `pwa-learning` original:**

- `getSubscription()` antes de `subscribe()` → evita duplicar.
- `subscription.toJSON()` → formato canônico `{endpoint, keys: {p256dh, auth}}`.
- Retorna `SubscribeResult` em vez de `void` → UI sabe se mostrar toast de sucesso/erro/já-inscrito.
- Cobre 4 estados de permissão (`unsupported`, `denied`, `granted` already, `default`).
- `unsubscribe` chama tanto o backend quanto `subscription.unsubscribe()` no browser.

## Passo 8: Stores Zustand

`src/store/useTokenStore.ts`:

```ts
import { create } from "zustand";
import { cookieGet } from "@/core/cookies";

interface TokenState {
  token: string | null;
  setToken: (token: string | null) => void;
  loadToken: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  loadToken: () => set({ token: cookieGet("token") ?? null }),
}));
```

`src/store/useUserStore.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cookieDelete } from "@/core/cookies";
import { clearStorageExcept, clearStorageWhiteList } from "@/utils/localStorage";
import { useTokenStore } from "./useTokenStore";

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  setUser: (user: UserResponse | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      logout: () => {
        cookieDelete("token");
        useTokenStore.getState().setToken(null);
        clearStorageExcept(clearStorageWhiteList);
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "user-storage" },
  ),
);
```

`src/store/useSSEStore.ts`:

```ts
import { create } from "zustand";

export interface SSEMessage {
  message_id: string;
  type: string;
  payload: unknown;
  receivedAt: number;
}

interface SSEState {
  messages: SSEMessage[];
  addMessage: (msg: SSEMessage) => void;
  clearAll: () => void;
}

const MAX_MESSAGES = 100;

export const useSSEStore = create<SSEState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-(MAX_MESSAGES - 1)), msg],
    })),
  clearAll: () => set({ messages: [] }),
}));
```

## Passo 9: Provider PWA — Install

`src/types/pwa.d.ts`:

```ts
export {};

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
```

`src/providers/PWAProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
  canInstall: boolean;
  install: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  canInstall: false,
  install: async () => {},
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install(): Promise<void> {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  }

  return (
    <PWAContext.Provider value={{ canInstall, install }}>
      {children}
    </PWAContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePWA() {
  return useContext(PWAContext);
}
```

## Passo 10: Provider PWA — Update

`src/providers/PWAUpdateProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

type UpdateFn = (reload?: boolean) => Promise<void>;

interface PWAUpdateContextType {
  canUpdate: boolean;
  updateApp: () => Promise<void>;
}

const PWAUpdateContext = createContext<PWAUpdateContextType>({
  canUpdate: false,
  updateApp: async () => {},
});

export function PWAUpdateProvider({ children }: { children: React.ReactNode }) {
  const [canUpdate, setCanUpdate] = useState(false);
  const [updateFn, setUpdateFn] = useState<UpdateFn | null>(null);

  useEffect(() => {
    const fn = registerSW({
      onNeedRefresh() {
        setUpdateFn(() => fn);
        setCanUpdate(true);
      },
      onOfflineReady() {
        if (import.meta.env.DEV) console.log("App pronto para uso offline");
      },
    });
  }, []);

  async function updateApp(): Promise<void> {
    if (!updateFn) return;
    await updateFn(true);
    window.location.reload();
  }

  return (
    <PWAUpdateContext.Provider value={{ canUpdate, updateApp }}>
      {children}
    </PWAUpdateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePWAUpdate() {
  return useContext(PWAUpdateContext);
}
```

**Diferença vs o original:** o `pwa-learning` chamava `registerSW` com `alert(...)` direto no callback de `onNeedRefresh` — bloqueando a thread e forçando refresh. Aqui o usuário decide quando atualizar (clica no botão).

## Passo 11: Provider SSE

`src/providers/SSEProvider.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { env } from "@/core/env";
import RequestHandler from "@/core/requests";
import { useTokenStore } from "@/store/useTokenStore";
import { useSSEStore } from "@/store/useSSEStore";

const RECONNECT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;

interface ServerEvent {
  type: string;
  payload: unknown;
  message_id?: string;
}

export default function SSEProvider({ children }: { children: React.ReactNode }) {
  const token = useTokenStore((s) => s.token);
  const addMessage = useSSEStore((s) => s.addMessage);
  const abortRef = useRef<AbortController | null>(null);
  const lastSeenRef = useRef<number>(Date.now());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      abortRef.current?.abort();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      return;
    }

    let cancelled = false;

    const scheduleReconnect = (): void => {
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!cancelled) connect();
      }, RECONNECT_INTERVAL_MS);
    };

    const connect = async (): Promise<void> => {
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const stream = await RequestHandler.getStream(
          `${env.API_URL}/sse/stream`,
          token,
          { signal: abortRef.current.signal },
        );
        lastSeenRef.current = Date.now();

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) throw new Error("Stream encerrada");

          lastSeenRef.current = Date.now();
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (let raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith(":")) continue;

            let dataLine = line;
            while (dataLine.startsWith("data:")) {
              dataLine = dataLine.replace(/^data:\s*/, "").trim();
            }

            try {
              const json = JSON.parse(dataLine) as ServerEvent;
              addMessage({
                message_id: json.message_id ?? crypto.randomUUID(),
                type: json.type,
                payload: json.payload,
                receivedAt: Date.now(),
              });
            } catch (err) {
              if (env.DEV_MODE) console.warn("SSE inválido:", dataLine, err);
            }
          }
        }
      } catch {
        if (abortRef.current?.signal.aborted) return;
        if (!cancelled) scheduleReconnect();
      }
    };

    const heartbeat = setInterval(() => {
      if (Date.now() - lastSeenRef.current > HEARTBEAT_TIMEOUT_MS) {
        abortRef.current?.abort();
      }
    }, 5_000);

    connect();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      clearInterval(heartbeat);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [token, addMessage]);

  return <>{children}</>;
}
```

**Por que tão envolvido:** SSE é simples no papel mas trabalhoso no real. O provider precisa:

1. Parar/reconectar quando `token` muda (login/logout).
2. Timeout 60s sem mensagem → força abort + reconnect (rede pode ter caído sem fechar TCP).
3. `AbortController` para cleanup limpo no `useEffect`.
4. Parser linha-a-linha porque o body do `fetch` é raw `Uint8Array`.
5. Ignorar comentários (`: ping`).

`src/providers/queryClientProvider.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

## Passo 12: Componentes PWA

`src/components/Pwa/InstallButton.tsx`:

```tsx
import { usePWA } from "@/providers/PWAProvider";

export default function InstallButton() {
  const { canInstall, install } = usePWA();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install}>
      Instalar app
    </button>
  );
}
```

`src/components/Pwa/UpdateButton.tsx`:

```tsx
import { usePWAUpdate } from "@/providers/PWAUpdateProvider";

export default function UpdateButton() {
  const { canUpdate, updateApp } = usePWAUpdate();
  if (!canUpdate) return null;
  return (
    <button type="button" onClick={updateApp}>
      🔄 Atualizar app
    </button>
  );
}
```

`src/components/Pwa/NotifyToggle.tsx`:

```tsx
import { useState } from "react";
import WebPushManager from "@/services/webpush";
import useUserIsSubscribed from "@/hooks/useUserIsSubscribed";

export default function NotifyToggle() {
  const subscribed = useUserIsSubscribed();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  async function toggle(): Promise<void> {
    setBusy(true);
    setFeedback("");
    try {
      if (subscribed) {
        await WebPushManager.unsubscribe();
        setFeedback("Notificações desativadas");
      } else {
        const result = await WebPushManager.subscribe();
        setFeedback(result.message);
      }
    } catch (err) {
      setFeedback(`Erro: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy}>
        {subscribed ? "Desativar notificações" : "Ativar notificações"}
      </button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
}
```

`src/hooks/useUserIsSubscribed.ts`:

```ts
import { useEffect, useState } from "react";
import WebPushManager from "@/services/webpush";

export default function useUserIsSubscribed(): boolean {
  const [subscribed, setSubscribed] = useState(false);
  useEffect(() => {
    let mounted = true;
    WebPushManager.isSubscribed().then((value) => {
      if (mounted) setSubscribed(value);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return subscribed;
}
```

## Passo 13: Roteamento

`src/core/constants/routes.ts`:

```ts
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  NOTIFICATIONS: "/notificacoes",
} as const;
```

`src/middlewares/PrivateRoute.tsx`:

```tsx
import { Navigate, Outlet } from "react-router";
import { ROUTES } from "@/core/constants/routes";
import { useUserStore } from "@/store/useUserStore";

export default function PrivateRoute() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
}
```

`src/routers/index.tsx`:

```tsx
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router";
import PrivateRoute from "@/middlewares/PrivateRoute";
import { ROUTES } from "@/core/constants/routes";
import { useTokenStore } from "@/store/useTokenStore";

const HomePage = lazy(() => import("@/pages/Home"));
const LoginPage = lazy(() => import("@/pages/Login"));

export default function AllRoutes() {
  const loadToken = useTokenStore((s) => s.loadToken);
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
```

## Passo 14: Pages

`src/pages/Login/index.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@/core/constants/routes";
import { cookieSet } from "@/core/cookies";
import { useUserStore } from "@/store/useUserStore";
import { useTokenStore } from "@/store/useTokenStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const setToken = useTokenStore((s) => s.setToken);
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    // Mock: token = user_id em texto plano (ver guias do backend)
    const fakeUserId = email.replace("@", "-").replace(".", "-");
    cookieSet("token", fakeUserId);
    setToken(fakeUserId);
    setUser({ id: fakeUserId, name: email.split("@")[0], email });
    navigate(ROUTES.HOME);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Entrar</button>
    </form>
  );
}
```

`src/pages/Home/index.tsx`:

```tsx
import InstallButton from "@/components/Pwa/InstallButton";
import UpdateButton from "@/components/Pwa/UpdateButton";
import NotifyToggle from "@/components/Pwa/NotifyToggle";
import { useUserStore } from "@/store/useUserStore";
import { useSSEStore } from "@/store/useSSEStore";

export default function HomePage() {
  const user = useUserStore((s) => s.user);
  const messages = useSSEStore((s) => s.messages);
  const logout = useUserStore((s) => s.logout);

  return (
    <main>
      <h1>Olá, {user?.name}</h1>

      <section>
        <h2>PWA</h2>
        <InstallButton />
        <UpdateButton />
      </section>

      <section>
        <h2>Notificações</h2>
        <NotifyToggle />
      </section>

      <section>
        <h2>Eventos SSE recentes</h2>
        <ul>
          {messages.length === 0 && <li><em>Nenhum evento ainda</em></li>}
          {messages.map((m) => (
            <li key={m.message_id}>
              <strong>{m.type}</strong>: {JSON.stringify(m.payload)}
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={logout}>Sair</button>
    </main>
  );
}
```

## Passo 15: App + main

`src/App.tsx`:

```tsx
import { BrowserRouter } from "react-router";
import AllRoutes from "@/routers";
import QueryProvider from "@/providers/queryClientProvider";
import { PWAProvider } from "@/providers/PWAProvider";
import { PWAUpdateProvider } from "@/providers/PWAUpdateProvider";
import SSEProvider from "@/providers/SSEProvider";

export default function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <PWAUpdateProvider>
          <PWAProvider>
            <SSEProvider>
              <AllRoutes />
            </SSEProvider>
          </PWAProvider>
        </PWAUpdateProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Importante:** o `registerSW` mora no `PWAUpdateProvider`, **não** no `main.tsx`. Assim ele só dispara dentro da árvore React e o callback `onNeedRefresh` consegue alimentar o estado do provider sem race condition.

## Passo 16: Build e teste local

```bash
npm run build
npm run preview
```

`npm run preview` serve o `dist/` em `http://localhost:4173`. Abra no Chrome:

1. **DevTools → Application → Manifest** — verifique que aparece "Add to home screen" disponível.
2. **DevTools → Application → Service Workers** — confirme que `sw.js` está registrado e ativo.
3. **DevTools → Application → Storage → Clear site data** — limpe entre testes.
4. Clique em **Instalar app** no botão. O app abre como standalone.
5. Clique em **Ativar notificações**, aceite a permissão.
6. No backend, envie um push:

   ```bash
   curl -X POST http://localhost:3001/webpush/notify/<seu-user-id> \
     -H "x-api-key: troque-esta-chave-em-prod" \
     -H "Content-Type: application/json" \
     -d '{"title":"Olá","body":"PWA funcionando!"}'
   ```

   A notificação deve aparecer no S.O. mesmo com a aba fechada.
7. Para SSE, com a aba aberta:

   ```bash
   curl -X POST http://localhost:3001/sse/emit/<seu-user-id> \
     -H "x-api-key: troque-esta-chave-em-prod" \
     -H "Content-Type: application/json" \
     -d '{"type":"chat","payload":{"text":"oi via SSE"}}'
   ```

   Aparece na lista da Home na hora.

## Checklist visual

Antes de declarar pronto, valide no navegador (use o **Playwright MCP** ou DevTools manual):

- [ ] **Instalar:** botão "Instalar app" aparece em Chrome desktop e mobile (Android).
- [ ] **Atualizar:** após `npm run build` com mudança, o botão "Atualizar app" aparece automaticamente sem reload manual.
- [ ] **Push permission:** o navegador pede permissão **só** quando o usuário clica no toggle (nunca no carregamento da página).
- [ ] **Push delivery:** notificação chega com o app fechado.
- [ ] **Push click:** clicar na notificação abre o app na URL definida em `data.url`.
- [ ] **SSE delivery:** evento aparece na lista < 100ms depois do `curl emit`.
- [ ] **SSE reconnect:** mate o backend, espere 30s, reinicie — o frontend reconecta sozinho.
- [ ] **Logout:** após logout, SSE desconecta e nada vaza no `localStorage` (exceto whitelist).
- [ ] **Offline:** com o backend morto, o app continua abrindo (precache do Workbox).

## Próximos passos

- Trocar o login mock por chamadas reais ao seu backend de auth.
- Adicionar **react-hook-form + zod** para formulários (pattern do alofans-frontend).
- Adicionar testes com **vitest + @testing-library/react**.
- Code splitting por rota com `manualChunks` no Vite (pattern do alofans-pwa).
- Adicionar `prefer_related_applications: false` no manifest se publicar em store.

---

**Voltar:** [README](../README.md) · [Backend Node](./01-backend-node.md) · [Backend FastAPI](./02-backend-fastapi.md)
