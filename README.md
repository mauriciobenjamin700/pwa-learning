# Guia: PWA Instalável com Web Push + SSE

Tutorial **de produção** que mostra como montar, do zero, uma Progressive Web App com:

- **Backend** que persiste inscrições Web Push, dispara notificações e mantém canal SSE em tempo real. Disponível em duas implementações:
  - [Node + Express + TypeScript](docs/01-backend-node.md)
  - [Python + FastAPI](docs/02-backend-fastapi.md)
- [Frontend React + Vite + TypeScript](docs/03-frontend.md) que:
  - é instalável como app nativo (manifest + install prompt + auto-update),
  - recebe notificações Web Push (mesmo com a aba fechada),
  - recebe eventos SSE em tempo real (com a aba aberta),
  - funciona offline (precache via Workbox).

## Por que dois canais?

| Canal | Funciona quando | Use para |
| --- | --- | --- |
| **Web Push** | App fechado, aba inativa, dispositivo bloqueado | Alertas que precisam atravessar o S.O. — mensagens, lembretes, status de pagamento |
| **SSE** | Aba aberta com sessão ativa | Atualizar UI em tempo real (chat, dashboard, contadores) sem polling |

Os dois se complementam: push acorda o usuário do lado de fora, SSE alimenta a UI por dentro.

## Arquitetura

```text
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Browser + SW   │ ─────────────► │     Backend      │
│   (React PWA)   │                │  (Node/FastAPI)  │
│                 │ ◄─ Push (FCM/  │                  │
│                 │     Mozilla)   │   ┌──────────┐   │
└─────────────────┘                │   │ SQLite   │   │
   │            ▲                  │   │ subs.db  │   │
   │            │                  │   └──────────┘   │
   │            │                  │                  │
   │  ┌─────────┴────── SSE ──────┐│                  │
   │  │  text/event-stream         ││                  │
   │  │  (canal persistente)       ││                  │
   │  └───────────────────────────►│└──────────────────┘
   └────────────────────────────────┘
```

Fluxo:

1. Frontend pede permissão (`Notification.requestPermission`) e cria `PushSubscription` no browser.
2. Frontend manda `{endpoint, keys: {p256dh, auth}}` para o backend (`POST /webpush/subscription`).
3. Backend persiste em SQLite com `endpoint UNIQUE`.
4. Quando algo acontece, backend usa `web-push` (Node) ou `pywebpush` (Python) para chamar o endpoint do FCM/Mozilla. O serviço de push entrega no S.O. do usuário, que dispara o handler do Service Worker.
5. Em paralelo, frontend abre `GET /sse/stream` com `Authorization: Bearer ...`. Backend mantém a conexão viva mandando linhas `data: {...}\n\n` e `: ping\n\n` como heartbeat.

## Stack

| Camada | Versões |
| --- | --- |
| **Backend Node** | Express 5, TypeScript 5, web-push 3, sqlite3, dotenv, cors |
| **Backend FastAPI** | Python 3.12+, FastAPI, SQLAlchemy 2.0 async, pydantic-settings, pywebpush, sse-starlette, aiosqlite |
| **Frontend** | React 19, Vite 6, TypeScript, vite-plugin-pwa (`injectManifest`), workbox-precaching, zustand, @tanstack/react-query, react-router v7, zod |

## Pré-requisitos

- Node.js ≥ 20 (frontend e backend Node)
- Python ≥ 3.12 + Poetry ou uv (backend FastAPI)
- HTTPS em produção (Push API e SW só funcionam em `https://` ou `http://localhost`)

## Estrutura do repositório

```text
pwa-learning/
├── README.md                      ← este arquivo
├── docs/
│   ├── 01-backend-node.md         ← guia Node + Express
│   ├── 02-backend-fastapi.md      ← guia FastAPI
│   └── 03-frontend.md             ← guia React + Vite PWA
├── node/                          ← backend Node + Express + TS (doc 01)
├── python/                        ← backend FastAPI (doc 02)
├── react/                         ← frontend React + Vite PWA (doc 03)
└── dump/                          ← v1 do tutorial (referência histórica)
    ├── backend/                   ← Node minimal generateSW (substituído por node/)
    └── frontend/                  ← React minimal generateSW (substituído por react/)
```

## Quickstart

```bash
# 1. Gerar chaves VAPID (use uma vez para os 3 projetos)
npx web-push generate-vapid-keys

# 2. Subir um dos backends
cd node && cp .env.example .env  # edite VAPID e WEBPUSH_API_KEY
npm install && npm run dev

# Ou (FastAPI)
cd python && cp .env.example .env  # edite VAPID e WEBPUSH_API_KEY
python3 -m venv .venv && .venv/bin/pip install -e . && .venv/bin/uvicorn src.api.app:app --reload --port 3001

# 3. Subir o frontend
cd react && cp .env.example .env  # cole VITE_VAPID_PUBLIC_KEY (mesma chave do backend)
npm install && npm run dev
```

Aplicação em `http://localhost:5173`. Backend em `http://localhost:3001`.

## Por onde começar

Leia os 3 docs em ordem. Cada um é independente, mas o frontend assume que pelo menos um backend esteja rodando.

1. Escolha um backend e siga [docs/01-backend-node.md](docs/01-backend-node.md) **ou** [docs/02-backend-fastapi.md](docs/02-backend-fastapi.md).
2. Siga [docs/03-frontend.md](docs/03-frontend.md) para subir o app.
3. Teste o fluxo ponta a ponta — install, subscribe, push, SSE.

## Convenções deste guia

- **Aspas duplas** em todos os strings (TS e Python).
- **Type hints / TS estrito** sempre.
- Erros de API no formato `{ status_code: number, detail: string }` (compatível com defaults do FastAPI).
- `endpoint` é `UNIQUE` na tabela de subscriptions — um device = um registro. Re-inscrição faz `INSERT OR REPLACE` (Node) ou `ON CONFLICT DO UPDATE` (FastAPI).
- Auth do cliente: `Authorization: Bearer <token>`. Auth interno (broadcast/emit cross-service): header `x-api-key`.
- Token nesta versão é **o user_id em texto plano** para simplificar — em produção, troque por JWT validado.
