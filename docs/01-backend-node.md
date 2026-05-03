# Backend Node + Express + TypeScript

Implementação Node do backend que persiste inscrições Web Push, dispara notificações via `web-push` e mantém canal SSE em tempo real.

## Estrutura final

```text
node/
├── package.json
├── tsconfig.json
├── .env.example
├── Makefile
├── src/
│   ├── server.ts                    ← entrypoint (dotenv + listen)
│   ├── app.ts                       ← express factory
│   ├── core/
│   │   ├── settings.ts              ← env vars validados
│   │   ├── errors.ts                ← hierarquia ApiError
│   │   └── messages/
│   │       ├── index.ts
│   │       ├── errors.ts
│   │       └── success.ts
│   ├── db/
│   │   ├── index.ts                 ← conexão SQLite
│   │   └── migrations.ts            ← create table
│   ├── repositories/
│   │   └── subscription.repository.ts
│   ├── services/
│   │   ├── webpush.service.ts
│   │   └── sse.service.ts
│   ├── controllers/
│   │   ├── webpush.controller.ts
│   │   └── sse.controller.ts
│   ├── routes/
│   │   ├── webpush.routes.ts
│   │   └── sse.routes.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── api-key.ts
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   └── types/
│       ├── notification.ts
│       └── sse.ts
└── data/
    └── subscriptions.db             ← SQLite (criado em runtime)
```

A arquitetura espelha o `alofans-webpush` (rotas → controllers → services → middlewares → handlers → core), mas expandida para também **persistir** subscriptions e **manter** conexões SSE em memória. O `alofans-webpush` original é stateless porque a persistência fica no `alofans-api`; aqui consolidamos em um único backend para simplificar o tutorial.

## Passo 1: Setup do projeto

```bash
mkdir node && cd node
npm init -y
npm install express cors body-parser dotenv web-push sqlite3
npm install -D typescript ts-node tsx \
  @types/node @types/express @types/cors @types/body-parser @types/web-push \
  tsconfig-paths
npx tsc --init
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*"]
}
```

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch -r tsconfig-paths/register src/server.ts",
    "build": "tsc",
    "start": "node -r tsconfig-paths/register dist/server.js",
    "generate:vapid": "npx web-push generate-vapid-keys"
  }
}
```

`Makefile` (opcional, espelha o padrão dos projetos de referência):

```make
generate-keys:
	npm run generate:vapid

dev:
	npm run dev

start:
	npm run build && npm run start
```

## Passo 2: Variáveis de ambiente

Gere as chaves VAPID **uma vez** — você vai usar a mesma pública no frontend:

```bash
npm run generate:vapid
```

`.env.example`:

```env
PORT=3001
NODE_ENV=development

VAPID_EMAIL=seu@email.com
VAPID_PUBLIC_KEY=BKxxx...
VAPID_PRIVATE_KEY=yyy...

# Protege endpoints internos (broadcast, emit interno)
WEBPUSH_API_KEY=troque-esta-chave-em-prod

DB_PATH=./data/subscriptions.db
```

`src/core/settings.ts`:

```ts
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
```

**Por quê fail-fast no boot:** se faltar `VAPID_PUBLIC_KEY` em produção, melhor o app não subir do que rodar e silenciosamente nunca enviar push.

## Passo 3: Hierarquia de erros e mensagens

`src/core/errors.ts` (idêntico ao de [`alofans-webpush/src/core/errors.ts`](../../companies/andall/alofans/alofans-webpush/src/core/errors.ts)):

```ts
export default class ApiError extends Error {
  status_code: number;
  detail: string;

  constructor(status_code: number, detail: string) {
    super(detail);
    this.status_code = status_code;
    this.detail = detail;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(detail = "Requisição inválida") { super(400, detail); }
}
export class UnauthorizedError extends ApiError {
  constructor(detail = "Não autenticado") { super(401, detail); }
}
export class ForbiddenError extends ApiError {
  constructor(detail = "Acesso negado") { super(403, detail); }
}
export class NotFoundError extends ApiError {
  constructor(detail = "Recurso não encontrado") { super(404, detail); }
}
export class ConflictError extends ApiError {
  constructor(detail = "Conflito") { super(409, detail); }
}
export class UnprocessableEntityError extends ApiError {
  constructor(detail = "Erro de validação") { super(422, detail); }
}
export class InternalServerError extends ApiError {
  constructor(detail = "Erro interno do servidor") { super(500, detail); }
}
```

`src/core/messages/errors.ts`:

```ts
export const ERROR_REQUIRED_ENDPOINT_KEYS = "endpoint e keys são obrigatórios";
export const ERROR_REQUIRED_TITLE_BODY = "title e body são obrigatórios";
export const ERROR_SUBSCRIPTION_NOT_FOUND = "Inscrição não encontrada";
export const ERROR_USER_NOT_AUTHENTICATED = "Usuário não autenticado";
export const ERROR_INVALID_API_KEY = "API key inválida ou ausente";
```

`src/core/messages/success.ts`:

```ts
export const SUCCESS_SUBSCRIBED = "Inscrito com sucesso";
export const SUCCESS_UNSUBSCRIBED = "Inscrição removida";
export const SUCCESS_NOTIFICATION_SENT = "Notificação enviada";
export const SUCCESS_BROADCAST_SENT = "Broadcast enviado";
export const SUCCESS_EVENT_EMITTED = "Evento emitido";
```

`src/core/messages/index.ts`:

```ts
export * from "./errors";
export * from "./success";
```

## Passo 4: Banco e repositório

`src/db/index.ts`:

```ts
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import settings from "@/core/settings";

const dbDir = path.dirname(settings.DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(settings.DB_PATH, (err) => {
  if (err) console.error("Erro ao conectar ao SQLite:", err.message);
  else console.log(`SQLite conectado em ${settings.DB_PATH}`);
});

export default db;
```

`src/db/migrations.ts`:

```ts
import db from "./index";

export function runMigrations(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`);
}
```

**Por que `endpoint UNIQUE`:** o mesmo navegador pode tentar se inscrever múltiplas vezes (toda vez que o usuário alternar o toggle). Sem `UNIQUE`, duplicaria registros.

`src/repositories/subscription.repository.ts`:

```ts
import db from "@/db";

export interface SubscriptionRow {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
  });
}

export default class SubscriptionRepository {
  static async create(input: {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<void> {
    await run(
      `INSERT OR REPLACE INTO subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)`,
      [input.user_id, input.endpoint, input.p256dh, input.auth],
    );
  }

  static listByUser(user_id: string): Promise<SubscriptionRow[]> {
    return all<SubscriptionRow>(
      `SELECT * FROM subscriptions WHERE user_id = ?`,
      [user_id],
    );
  }

  static listAll(): Promise<SubscriptionRow[]> {
    return all<SubscriptionRow>(`SELECT * FROM subscriptions`);
  }

  static deleteByEndpoint(endpoint: string): Promise<void> {
    return run(`DELETE FROM subscriptions WHERE endpoint = ?`, [endpoint]);
  }

  static deleteAllByUser(user_id: string): Promise<void> {
    return run(`DELETE FROM subscriptions WHERE user_id = ?`, [user_id]);
  }
}
```

**Por que promisificar manualmente:** o `sqlite3` nativo só aceita callbacks. Sem isso, `await db.run(...)` é no-op (retorna `undefined` na hora). Esse é exatamente o bug do `dump/backend/index.js:200` original (v1 do tutorial).

## Passo 5: Middlewares

`src/middlewares/auth.ts` — versão simplificada para o tutorial. Em produção troque por `jwt.verify`:

```ts
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/core/errors";
import { ERROR_USER_NOT_AUTHENTICATED } from "@/core/messages";

declare global {
  namespace Express {
    interface Request {
      user_id?: string;
    }
  }
}

export default function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return next(new UnauthorizedError(ERROR_USER_NOT_AUTHENTICATED));
  }
  // TODO produção: const payload = jwt.verify(token, JWT_SECRET); req.user_id = payload.sub;
  req.user_id = header.slice(7).trim();
  next();
}
```

`src/middlewares/api-key.ts` — protege endpoints internos:

```ts
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/core/errors";
import { ERROR_INVALID_API_KEY } from "@/core/messages";
import settings from "@/core/settings";

export default function apiKey(req: Request, _res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key || key !== settings.WEBPUSH_API_KEY) {
    return next(new UnauthorizedError(ERROR_INVALID_API_KEY));
  }
  next();
}
```

`src/middlewares/error-handler.ts`:

```ts
import { ErrorRequestHandler } from "express";
import ApiError from "@/core/errors";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status_code).json({
      status_code: err.status_code,
      detail: err.detail,
    });
    return;
  }
  console.error("Erro não tratado:", err);
  res.status(500).json({
    status_code: 500,
    detail: "Erro interno do servidor",
  });
};

export default errorHandler;
```

`src/middlewares/logger.ts`:

```ts
import { Request, Response, NextFunction } from "express";

export default function logger(req: Request, _res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}
```

## Passo 6: Web Push service

`src/types/notification.ts`:

```ts
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
```

`src/services/webpush.service.ts`:

```ts
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

async function sendToRow(row: SubscriptionRow, payload: string): Promise<boolean> {
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
      // Inscrição expirou ou foi revogada → limpar
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
```

**Detalhes que valem o tempo:**

- `TTL: 60` — push expira em 60s se o device estiver offline. Sem TTL, o serviço de push pode acumular dias de notificações velhas e disparar todas quando o usuário voltar.
- `timeout: 10_000` — não trava a thread esperando endpoint que sumiu.
- `404`/`410` → registro deletado. É como o serviço de push diz "esse endpoint não existe mais" (usuário desinstalou o app, limpou dados, etc.).
- Payload **flat** (`{title, body, ...}` direto, sem wrapping `{notification: {...}}`). O service worker do frontend lê `data.title`/`data.body` direto.

## Passo 7: Web Push controllers e routes

`src/controllers/webpush.controller.ts`:

```ts
import { Request, Response, NextFunction } from "express";
import SubscriptionRepository from "@/repositories/subscription.repository";
import WebPushService from "@/services/webpush.service";
import { NotFoundError, UnprocessableEntityError } from "@/core/errors";
import {
  ERROR_REQUIRED_ENDPOINT_KEYS,
  ERROR_REQUIRED_TITLE_BODY,
  ERROR_SUBSCRIPTION_NOT_FOUND,
  SUCCESS_BROADCAST_SENT,
  SUCCESS_NOTIFICATION_SENT,
  SUCCESS_SUBSCRIBED,
  SUCCESS_UNSUBSCRIBED,
} from "@/core/messages";
import { NotificationData } from "@/types/notification";

export default class WebPushController {
  static async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { endpoint, keys } = req.body ?? {};
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_ENDPOINT_KEYS);
      }
      await SubscriptionRepository.create({
        user_id: req.user_id!,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.status(201).json({ status_code: 201, detail: SUCCESS_SUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async unsubscribeAll(req: Request, res: Response, next: NextFunction) {
    try {
      await SubscriptionRepository.deleteAllByUser(req.user_id!);
      res.json({ status_code: 200, detail: SUCCESS_UNSUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async deleteByEndpoint(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const endpoint = req.query.endpoint as string | undefined;
      if (!endpoint) throw new NotFoundError(ERROR_SUBSCRIPTION_NOT_FOUND);
      await SubscriptionRepository.deleteByEndpoint(endpoint);
      res.json({ status_code: 200, detail: SUCCESS_UNSUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async notifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = req.params;
      const data = req.body as NotificationData;
      if (!data?.title || !data?.body) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY);
      }
      const result = await WebPushService.sendToUser(user_id, data);
      res.json({
        status_code: 200,
        detail: SUCCESS_NOTIFICATION_SENT,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }

  static async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as NotificationData;
      if (!data?.title || !data?.body) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY);
      }
      const result = await WebPushService.broadcast(data);
      res.json({
        status_code: 200,
        detail: SUCCESS_BROADCAST_SENT,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }
}
```

`src/routes/webpush.routes.ts`:

```ts
import { Router } from "express";
import auth from "@/middlewares/auth";
import apiKey from "@/middlewares/api-key";
import WebPushController from "@/controllers/webpush.controller";

const router = Router();

// Rotas do cliente — autenticadas por Bearer
router.post("/subscription", auth, WebPushController.subscribe);
router.delete("/subscription", auth, WebPushController.unsubscribeAll);

// Rotas internas — autenticadas por API key
router.delete("/subscription/by-endpoint", apiKey, WebPushController.deleteByEndpoint);
router.post("/notify/:user_id", apiKey, WebPushController.notifyUser);
router.post("/notify", apiKey, WebPushController.broadcast);

export default router;
```

**Por que separar Bearer e API key:** o cliente nunca pode disparar broadcast — só serviços internos (background jobs, webhooks de pagamento, suporte) deveriam. Usar headers diferentes força essa separação na infra.

## Passo 8: SSE service

A ideia: manter um `Map<user_id, Set<Response>>` em memória. Cada `GET /sse/stream` adiciona seu `res` ao set; cada `emit` itera e escreve `data: {...}\n\n`. Sem Redis/pub-sub, isso só escala para 1 instância — quando precisar escalar, o `transport-frontend` mostra o pattern de adicionar Redis pub/sub no meio.

`src/types/sse.ts`:

```ts
export interface SSEEvent<T = unknown> {
  type: string;
  payload: T;
  message_id?: string;
}
```

`src/services/sse.service.ts`:

```ts
import { Response } from "express";
import { randomUUID } from "node:crypto";
import { SSEEvent } from "@/types/sse";

const HEARTBEAT_INTERVAL_MS = 25_000;

function serialize(event: SSEEvent): string {
  const payload = { ...event, message_id: event.message_id ?? randomUUID() };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

class SSEManager {
  private clients = new Map<string, Set<Response>>();

  add(user_id: string, res: Response): void {
    const set = this.clients.get(user_id) ?? new Set<Response>();
    set.add(res);
    this.clients.set(user_id, set);

    const heartbeat = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(heartbeat);
        this.remove(user_id, res);
      }
    }, HEARTBEAT_INTERVAL_MS);

    res.on("close", () => {
      clearInterval(heartbeat);
      this.remove(user_id, res);
    });
  }

  private remove(user_id: string, res: Response): void {
    const set = this.clients.get(user_id);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.clients.delete(user_id);
  }

  emit(user_id: string, event: SSEEvent): number {
    const set = this.clients.get(user_id);
    if (!set) return 0;
    const data = serialize(event);
    let delivered = 0;
    for (const res of set) {
      try {
        res.write(data);
        delivered++;
      } catch {
        this.remove(user_id, res);
      }
    }
    return delivered;
  }

  broadcast(event: SSEEvent): number {
    const data = serialize(event);
    let delivered = 0;
    for (const set of this.clients.values()) {
      for (const res of set) {
        try {
          res.write(data);
          delivered++;
        } catch {
          // ignored — close handler limpa
        }
      }
    }
    return delivered;
  }

  countConnections(): number {
    let total = 0;
    for (const set of this.clients.values()) total += set.size;
    return total;
  }
}

const sseManager = new SSEManager();
export default sseManager;
```

**Detalhes técnicos:**

- `: ping\n\n` é um **comentário SSE** (linha que começa com `:`). Browser ignora, mas força o socket a continuar vivo — fundamental atrás de proxies que dropam conexões idle.
- `25s` é abaixo do default de 30s do Nginx/Cloudflare.
- `res.on("close", ...)` dispara quando o cliente fecha aba ou perde rede — limpamos do map para não vazar memória.
- O frontend ([transport-frontend sseprovider.tsx](../../companies/tempest/transport/transport-frontend/src/providers/sseprovider.tsx)) tem o lado complementar: timeout de 60s sem mensagem força reconnect.

## Passo 9: SSE controllers e routes

`src/controllers/sse.controller.ts`:

```ts
import { NextFunction, Request, Response } from "express";
import sseManager from "@/services/sse.service";
import { SSEEvent } from "@/types/sse";
import { SUCCESS_BROADCAST_SENT, SUCCESS_EVENT_EMITTED } from "@/core/messages";
import { UnprocessableEntityError } from "@/core/errors";

function validate(event: unknown): SSEEvent {
  if (
    !event ||
    typeof event !== "object" ||
    !("type" in event) ||
    typeof (event as SSEEvent).type !== "string"
  ) {
    throw new UnprocessableEntityError("Campo 'type' é obrigatório");
  }
  return event as SSEEvent;
}

export default class SSEController {
  static stream(req: Request, res: Response): void {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write(": connected\n\n");
    sseManager.add(req.user_id!, res);
  }

  static emitToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = req.params;
      const event = validate(req.body);
      const delivered = sseManager.emit(user_id, event);
      res.json({
        status_code: 200,
        detail: SUCCESS_EVENT_EMITTED,
        delivered,
      });
    } catch (e) {
      next(e);
    }
  }

  static broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const event = validate(req.body);
      const delivered = sseManager.broadcast(event);
      res.json({
        status_code: 200,
        detail: SUCCESS_BROADCAST_SENT,
        delivered,
      });
    } catch (e) {
      next(e);
    }
  }
}
```

`src/routes/sse.routes.ts`:

```ts
import { Router } from "express";
import auth from "@/middlewares/auth";
import apiKey from "@/middlewares/api-key";
import SSEController from "@/controllers/sse.controller";

const router = Router();

router.get("/stream", auth, SSEController.stream);
router.post("/emit/broadcast", apiKey, SSEController.broadcast);
router.post("/emit/:user_id", apiKey, SSEController.emitToUser);

export default router;
```

**Headers obrigatórios em `/sse/stream`:**

- `Content-Type: text/event-stream` — sinaliza ao browser que é SSE.
- `Cache-Control: no-cache, no-transform` — evita proxies bufferizarem.
- `Connection: keep-alive` — não fechar TCP.
- `X-Accel-Buffering: no` — específico do Nginx, desabilita buffering por response.

## Passo 10: app + server

`src/app.ts`:

```ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import logger from "@/middlewares/logger";
import errorHandler from "@/middlewares/error-handler";
import webpushRoutes from "@/routes/webpush.routes";
import sseRoutes from "@/routes/sse.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(logger);

app.get("/", (_req, res) =>
  res.json({ status_code: 200, detail: "API Running!" }),
);

app.use("/webpush", webpushRoutes);
app.use("/sse", sseRoutes);

app.use(errorHandler);

export default app;
```

`src/server.ts`:

```ts
import settings from "@/core/settings";
import { runMigrations } from "@/db/migrations";
import app from "@/app";

runMigrations();

app.listen(settings.PORT, () => {
  console.log(`Backend Node rodando em http://localhost:${settings.PORT}`);
  console.log(`VAPID pública: ${settings.VAPID_PUBLIC_KEY}`);
});
```

## Passo 11: Rodar e testar

```bash
npm run dev
```

Saída esperada:

```text
SQLite conectado em ./data/subscriptions.db
Backend Node rodando em http://localhost:3001
VAPID pública: BKxxx...
```

Teste manual com `curl`:

```bash
# 1) Subscrever (token é o user_id em texto plano nesta versão)
curl -X POST http://localhost:3001/webpush/subscription \
  -H "Authorization: Bearer user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/dummy",
    "keys": { "p256dh": "BKxxx", "auth": "yyy" }
  }'

# 2) Listar conexões SSE em uma janela separada
curl -N http://localhost:3001/sse/stream \
  -H "Authorization: Bearer user-123"
# (mantenha aberto)

# 3) Emitir SSE para esse user
curl -X POST http://localhost:3001/sse/emit/user-123 \
  -H "x-api-key: troque-esta-chave-em-prod" \
  -H "Content-Type: application/json" \
  -d '{"type":"chat-message","payload":{"text":"oi"}}'

# 4) Disparar push para esse user
curl -X POST http://localhost:3001/webpush/notify/user-123 \
  -H "x-api-key: troque-esta-chave-em-prod" \
  -H "Content-Type: application/json" \
  -d '{"title":"Olá","body":"Teste"}'
```

## Endpoints — referência rápida

| Método | Path | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/webpush/subscription` | Bearer | Salva subscription do usuário |
| `DELETE` | `/webpush/subscription` | Bearer | Remove todas do usuário |
| `DELETE` | `/webpush/subscription/by-endpoint?endpoint=...` | x-api-key | Remove uma específica (interno) |
| `POST` | `/webpush/notify/:user_id` | x-api-key | Push para um usuário |
| `POST` | `/webpush/notify` | x-api-key | Broadcast |
| `GET` | `/sse/stream` | Bearer | Conexão SSE |
| `POST` | `/sse/emit/:user_id` | x-api-key | Emit SSE para usuário |
| `POST` | `/sse/emit/broadcast` | x-api-key | Broadcast SSE |

## Próximos passos (produção)

- Trocar Bearer plain por **JWT** assinado (`jsonwebtoken`).
- Trocar SQLite por **PostgreSQL** quando passar de uma instância.
- Adicionar **Redis pub/sub** entre instâncias para SSE multi-node.
- Logs estruturados com **pino** ou **winston**.
- Rate limiting com **express-rate-limit** (ex.: 20 req/s por IP, como o `transport-backend`).
- Healthcheck endpoint `/health` para o Docker/Kubernetes.

Próximo: [Backend FastAPI](./02-backend-fastapi.md) ou [Frontend](./03-frontend.md).
