# Backend Python + FastAPI

Implementação FastAPI do backend que persiste inscrições Web Push (SQLAlchemy 2.0 async), dispara notificações via `pywebpush` e mantém canal SSE em tempo real via `sse-starlette`.

## Estrutura final

```text
python/
├── pyproject.toml
├── .env.example
├── Makefile
├── src/
│   ├── server.py                    ← entrypoint (uvicorn)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── settings.py              ← BaseSettings
│   │   ├── errors.py                ← hierarquia ApiError
│   │   └── messages/
│   │       ├── __init__.py
│   │       ├── errors.py
│   │       └── success.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py               ← engine + AsyncSession
│   │   ├── base.py                  ← DeclarativeBase
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── subscription.py
│   │   └── repositories/
│   │       ├── __init__.py
│   │       └── subscription.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── webpush.py
│   │   └── sse.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── webpush.py
│   │   └── sse.py
│   ├── controllers/
│   │   ├── __init__.py
│   │   ├── webpush.py
│   │   └── sse.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── app.py                   ← FastAPI factory
│   │   ├── dependencies/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── db.py
│   │   ├── middlewares/
│   │   │   ├── __init__.py
│   │   │   ├── error_handler.py
│   │   │   └── logger.py
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── webpush.py
│   │       └── sse.py
│   └── utils/
│       └── __init__.py
└── data/
    └── subscriptions.db             ← SQLite (criado em runtime)
```

A estrutura segue exatamente o padrão definido no [CLAUDE.md global](~/.claude/CLAUDE.md): `routers → controllers → services → repositories → models`.

## Passo 1: Setup do projeto

Com Poetry:

```bash
mkdir python && cd python
poetry init -n --name python --python "^3.12"
poetry add fastapi "uvicorn[standard]" sqlalchemy aiosqlite \
  pydantic-settings pywebpush sse-starlette
poetry add --group dev mypy ruff pytest pytest-asyncio httpx
```

`pyproject.toml`:

```toml
[tool.poetry]
name = "python"
version = "0.1.0"
description = "PWA backend — Web Push + SSE"
authors = ["Mauricio <mauriciobenjamin700@gmail.com>"]
readme = "README.md"
packages = [{ include = "src" }]

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.115.0"
uvicorn = { extras = ["standard"], version = "^0.32.0" }
sqlalchemy = "^2.0.36"
aiosqlite = "^0.20.0"
pydantic-settings = "^2.6.0"
pywebpush = "^2.0.0"
sse-starlette = "^2.1.3"

[tool.poetry.group.dev.dependencies]
mypy = "^1.13"
ruff = "^0.7"
pytest = "^8.3"
pytest-asyncio = "^0.24"
httpx = "^0.27"

[tool.poetry.scripts]
dev = "src.server:dev"
start = "src.server:start"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

`Makefile`:

```make
generate-keys:
	poetry run python -c "from py_vapid import Vapid; v = Vapid(); v.generate_keys(); print('PUBLIC:', v.public_key.public_bytes(encoding='raw', format='uncompressed').hex()); print('PRIVATE:', v.private_key.private_bytes(encoding='raw', format='uncompressed').hex())"

dev:
	poetry run uvicorn src.api.app:app --reload --port 3001

start:
	poetry run uvicorn src.api.app:app --host 0.0.0.0 --port 3001
```

> Para gerar VAPID em Python use o script acima ou simplesmente reaproveite as chaves geradas com `npx web-push generate-vapid-keys` (formato é o mesmo).

## Passo 2: Variáveis de ambiente

`.env.example`:

```env
PORT=3001
NODE_ENV=development

VAPID_EMAIL=seu@email.com
VAPID_PUBLIC_KEY=BKxxx...
VAPID_PRIVATE_KEY=yyy...

WEBPUSH_API_KEY=troque-esta-chave-em-prod

DATABASE_URL=sqlite+aiosqlite:///./data/subscriptions.db
```

`src/core/settings.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True,
        str_strip_whitespace=True,
    )

    PORT: int = 3001
    NODE_ENV: str = "development"

    VAPID_EMAIL: str
    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    WEBPUSH_API_KEY: str

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/subscriptions.db"


settings: Settings = Settings()
```

`src/core/__init__.py`:

```python
from src.core.settings import settings

__all__: list[str] = ["settings"]
```

**Por que `BaseSettings`:** validação no boot. Se faltar `VAPID_PRIVATE_KEY`, app não sobe — não corre o risco de descobrir só na hora do primeiro push.

## Passo 3: Erros e mensagens

`src/core/errors.py`:

```python
class ApiError(Exception):
    """Base API exception with HTTP status code and JSON-friendly detail."""

    def __init__(self, status_code: int, detail: str) -> None:
        """Initialize the API error.

        Args:
            status_code: HTTP status code.
            detail: Human-readable error message.
        """
        self.status_code: int = status_code
        self.detail: str = detail
        super().__init__(detail)


class BadRequestError(ApiError):
    def __init__(self, detail: str = "Requisição inválida") -> None:
        super().__init__(400, detail)


class UnauthorizedError(ApiError):
    def __init__(self, detail: str = "Não autenticado") -> None:
        super().__init__(401, detail)


class ForbiddenError(ApiError):
    def __init__(self, detail: str = "Acesso negado") -> None:
        super().__init__(403, detail)


class NotFoundError(ApiError):
    def __init__(self, detail: str = "Recurso não encontrado") -> None:
        super().__init__(404, detail)


class ConflictError(ApiError):
    def __init__(self, detail: str = "Conflito") -> None:
        super().__init__(409, detail)


class UnprocessableEntityError(ApiError):
    def __init__(self, detail: str = "Erro de validação") -> None:
        super().__init__(422, detail)


class InternalServerError(ApiError):
    def __init__(self, detail: str = "Erro interno do servidor") -> None:
        super().__init__(500, detail)
```

`src/core/messages/errors.py`:

```python
ERROR_REQUIRED_ENDPOINT_KEYS: str = "endpoint e keys são obrigatórios"
ERROR_REQUIRED_TITLE_BODY: str = "title e body são obrigatórios"
ERROR_SUBSCRIPTION_NOT_FOUND: str = "Inscrição não encontrada"
ERROR_USER_NOT_AUTHENTICATED: str = "Usuário não autenticado"
ERROR_INVALID_API_KEY: str = "API key inválida ou ausente"
ERROR_REQUIRED_TYPE: str = "Campo 'type' é obrigatório"
```

`src/core/messages/success.py`:

```python
SUCCESS_SUBSCRIBED: str = "Inscrito com sucesso"
SUCCESS_UNSUBSCRIBED: str = "Inscrição removida"
SUCCESS_NOTIFICATION_SENT: str = "Notificação enviada"
SUCCESS_BROADCAST_SENT: str = "Broadcast enviado"
SUCCESS_EVENT_EMITTED: str = "Evento emitido"
```

`src/core/messages/__init__.py`:

```python
from src.core.messages.errors import (
    ERROR_INVALID_API_KEY,
    ERROR_REQUIRED_ENDPOINT_KEYS,
    ERROR_REQUIRED_TITLE_BODY,
    ERROR_REQUIRED_TYPE,
    ERROR_SUBSCRIPTION_NOT_FOUND,
    ERROR_USER_NOT_AUTHENTICATED,
)
from src.core.messages.success import (
    SUCCESS_BROADCAST_SENT,
    SUCCESS_EVENT_EMITTED,
    SUCCESS_NOTIFICATION_SENT,
    SUCCESS_SUBSCRIBED,
    SUCCESS_UNSUBSCRIBED,
)

__all__: list[str] = [
    "ERROR_INVALID_API_KEY",
    "ERROR_REQUIRED_ENDPOINT_KEYS",
    "ERROR_REQUIRED_TITLE_BODY",
    "ERROR_REQUIRED_TYPE",
    "ERROR_SUBSCRIPTION_NOT_FOUND",
    "ERROR_USER_NOT_AUTHENTICATED",
    "SUCCESS_BROADCAST_SENT",
    "SUCCESS_EVENT_EMITTED",
    "SUCCESS_NOTIFICATION_SENT",
    "SUCCESS_SUBSCRIBED",
    "SUCCESS_UNSUBSCRIBED",
]
```

## Passo 4: Modelo + sessão

`src/db/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass
```

`src/db/models/subscription.py`:

```python
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.db.base import Base


class SubscriptionModel(Base):
    """ORM model for a Web Push subscription bound to a user."""

    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    endpoint: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    p256dh: Mapped[str] = mapped_column(String, nullable=False)
    auth: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_subscriptions_user", "user_id"),
    )
```

`src/db/models/__init__.py`:

```python
from src.db.models.subscription import SubscriptionModel

__all__: list[str] = ["SubscriptionModel"]
```

`src/db/session.py`:

```python
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core import settings
from src.db.base import Base


def _ensure_db_dir(database_url: str) -> None:
    """Ensure the SQLite parent directory exists.

    Args:
        database_url: SQLAlchemy URL like 'sqlite+aiosqlite:///./data/foo.db'.
    """
    if "sqlite" not in database_url:
        return
    path_part = database_url.split("///", maxsplit=1)[-1]
    db_path = Path(path_part)
    db_path.parent.mkdir(parents=True, exist_ok=True)


_ensure_db_dir(settings.DATABASE_URL)

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Create all tables. Used at startup for SQLite; migrate with Alembic in prod."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session for FastAPI dependency injection.

    Yields:
        AsyncSession: Active SQLAlchemy async session.
    """
    async with async_session_maker() as session:
        yield session
```

`src/db/__init__.py`:

```python
from src.db.session import async_session_maker, engine, get_session, init_db

__all__: list[str] = [
    "async_session_maker",
    "engine",
    "get_session",
    "init_db",
]
```

## Passo 5: Repositório

`src/db/repositories/subscription.py`:

```python
from sqlalchemy import delete, select
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import SubscriptionModel


class SubscriptionRepository:
    """Repository for Web Push subscription persistence."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the repository.

        Args:
            session: The async database session.
        """
        self.session: AsyncSession = session

    async def upsert(
        self,
        user_id: str,
        endpoint: str,
        p256dh: str,
        auth: str,
    ) -> None:
        """Create or replace a subscription.

        Args:
            user_id: Owner of the subscription.
            endpoint: Push service endpoint URL.
            p256dh: Base64 public key from the browser subscription.
            auth: Base64 auth secret from the browser subscription.
        """
        stmt = (
            insert(SubscriptionModel)
            .values(user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
            .on_conflict_do_update(
                index_elements=[SubscriptionModel.endpoint],
                set_={"user_id": user_id, "p256dh": p256dh, "auth": auth},
            )
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def list_by_user(self, user_id: str) -> list[SubscriptionModel]:
        """List all subscriptions for a given user.

        Args:
            user_id: Owner identifier.

        Returns:
            List of subscriptions; empty list if none.
        """
        result = await self.session.execute(
            select(SubscriptionModel).where(SubscriptionModel.user_id == user_id)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[SubscriptionModel]:
        """List every subscription in the database.

        Returns:
            List of subscriptions; empty list if none.
        """
        result = await self.session.execute(select(SubscriptionModel))
        return list(result.scalars().all())

    async def delete_by_endpoint(self, endpoint: str) -> None:
        """Delete a subscription by its endpoint URL.

        Args:
            endpoint: Push service endpoint to remove.
        """
        await self.session.execute(
            delete(SubscriptionModel).where(SubscriptionModel.endpoint == endpoint)
        )
        await self.session.commit()

    async def delete_all_by_user(self, user_id: str) -> None:
        """Delete all subscriptions owned by a user.

        Args:
            user_id: Owner identifier.
        """
        await self.session.execute(
            delete(SubscriptionModel).where(SubscriptionModel.user_id == user_id)
        )
        await self.session.commit()
```

`src/db/repositories/__init__.py`:

```python
from src.db.repositories.subscription import SubscriptionRepository

__all__: list[str] = ["SubscriptionRepository"]
```

**Detalhes:**

- `insert(...).on_conflict_do_update(...)` é o equivalente SQLAlchemy do `INSERT OR REPLACE`. Para PostgreSQL, troque o import para `from sqlalchemy.dialects.postgresql import insert`.
- `list(result.scalars().all())` — converte `Sequence` em `list` para casar com a anotação de retorno.
- Métodos plurais (`list_*`) retornam `list[]` mesmo quando vazio, nunca `None` — convenção do CLAUDE.md global.

## Passo 6: Schemas Pydantic

`src/schemas/webpush.py`:

```python
from pydantic import BaseModel, Field


class KeysSchema(BaseModel):
    """Browser-provided VAPID auth/encryption keys."""

    p256dh: str
    auth: str


class SubscriptionCreateSchema(BaseModel):
    """Payload sent by the client when subscribing to push."""

    endpoint: str
    keys: KeysSchema


class NotificationDataSchema(BaseModel):
    """Notification payload sent to the push service."""

    title: str
    body: str
    icon: str | None = None
    badge: str | None = None
    image: str | None = None
    vibrate: list[int] = Field(default_factory=lambda: [100, 50, 100])
    url: str | None = None
    requireInteraction: bool = False
    tag: str = "default"


class NotificationResultSchema(BaseModel):
    """Result of a push send operation."""

    sent: int
    failed: int


class MessageSchema(BaseModel):
    """Standard JSON envelope for status responses."""

    status_code: int
    detail: str
```

`src/schemas/sse.py`:

```python
from typing import Any

from pydantic import BaseModel


class SSEEventSchema(BaseModel):
    """Event broadcast over the SSE channel."""

    type: str
    payload: Any
    message_id: str | None = None
```

`src/schemas/__init__.py`:

```python
from src.schemas.sse import SSEEventSchema
from src.schemas.webpush import (
    KeysSchema,
    MessageSchema,
    NotificationDataSchema,
    NotificationResultSchema,
    SubscriptionCreateSchema,
)

__all__: list[str] = [
    "KeysSchema",
    "MessageSchema",
    "NotificationDataSchema",
    "NotificationResultSchema",
    "SSEEventSchema",
    "SubscriptionCreateSchema",
]
```

## Passo 7: Web Push service

`src/services/webpush.py`:

```python
import asyncio
import json
import logging
from typing import Any

from pywebpush import WebPushException, webpush

from src.core import settings
from src.db.models import SubscriptionModel
from src.db.repositories import SubscriptionRepository
from src.schemas import NotificationDataSchema, NotificationResultSchema

logger = logging.getLogger(__name__)

PUSH_OPTIONS: dict[str, Any] = {"ttl": 60, "timeout": 10}


def _build_payload(data: NotificationDataSchema) -> str:
    """Serialize a notification payload as JSON for the push service.

    Args:
        data: Notification fields supplied by the caller.

    Returns:
        JSON string ready to be encrypted by pywebpush.
    """
    return json.dumps({
        "title": data.title,
        "body": data.body,
        "icon": data.icon or "/pwa-192x192.png",
        "badge": data.badge or "/pwa-192x192.png",
        "image": data.image,
        "vibrate": data.vibrate,
        "requireInteraction": data.requireInteraction,
        "tag": data.tag,
        "data": {"url": data.url or "/"},
    })


class WebPushService:
    """Sends Web Push notifications via VAPID."""

    def __init__(self, repository: SubscriptionRepository) -> None:
        """Initialize the service.

        Args:
            repository: Subscription repository used to lookup and clean targets.
        """
        self.repository: SubscriptionRepository = repository

    async def _send_one(
        self,
        subscription: SubscriptionModel,
        payload: str,
    ) -> bool:
        """Send a payload to a single subscription, cleaning expired ones.

        Args:
            subscription: Target subscription row.
            payload: Pre-built JSON payload.

        Returns:
            True on success, False on any failure.
        """
        try:
            await asyncio.to_thread(
                webpush,
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_EMAIL}"},
                ttl=PUSH_OPTIONS["ttl"],
                timeout=PUSH_OPTIONS["timeout"],
            )
            return True
        except WebPushException as exc:
            status = getattr(exc.response, "status_code", None)
            if status in (404, 410):
                # Inscrição expirou ou foi revogada → limpar
                await self.repository.delete_by_endpoint(subscription.endpoint)
            else:
                logger.warning("Erro web push (status=%s): %s", status, exc)
            return False
        except Exception:
            logger.exception("Erro inesperado ao enviar push")
            return False

    async def send_to_user(
        self,
        user_id: str,
        data: NotificationDataSchema,
    ) -> NotificationResultSchema:
        """Send a notification to every device of a user.

        Args:
            user_id: Target user identifier.
            data: Notification payload.

        Returns:
            Counts of successful and failed deliveries.
        """
        subs = await self.repository.list_by_user(user_id)
        if not subs:
            return NotificationResultSchema(sent=0, failed=0)

        payload = _build_payload(data)
        results = await asyncio.gather(
            *(self._send_one(sub, payload) for sub in subs)
        )
        sent = sum(1 for ok in results if ok)
        return NotificationResultSchema(sent=sent, failed=len(results) - sent)

    async def broadcast(
        self,
        data: NotificationDataSchema,
    ) -> NotificationResultSchema:
        """Broadcast a notification to every registered subscription.

        Args:
            data: Notification payload.

        Returns:
            Counts of successful and failed deliveries.
        """
        subs = await self.repository.list_all()
        if not subs:
            return NotificationResultSchema(sent=0, failed=0)

        payload = _build_payload(data)
        results = await asyncio.gather(
            *(self._send_one(sub, payload) for sub in subs)
        )
        sent = sum(1 for ok in results if ok)
        return NotificationResultSchema(sent=sent, failed=len(results) - sent)
```

**Detalhes técnicos:**

- `pywebpush` é **síncrono** — usamos `asyncio.to_thread(webpush, ...)` para não bloquear o event loop.
- `asyncio.gather(*(self._send_one(...) for ...))` envia **em paralelo**. Para 1000 subs, isso é ordens de grandeza mais rápido que o loop sequencial do `alofans-webpush`.
- `404`/`410` → registro deletado do banco automaticamente. Subscription que o serviço de push diz que não existe mais é lixo.

## Passo 8: SSE service

`src/services/sse.py`:

```python
import asyncio
import json
import logging
import uuid
from collections.abc import AsyncIterator

from src.schemas import SSEEventSchema

logger = logging.getLogger(__name__)


class SSEManager:
    """In-memory SSE connection manager keyed by user_id."""

    def __init__(self) -> None:
        """Initialize the manager."""
        self._clients: dict[str, set[asyncio.Queue[str]]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str) -> asyncio.Queue[str]:
        """Register a new SSE consumer for a user.

        Args:
            user_id: Owner of the connection.

        Returns:
            Queue from which the caller streams events to the response.
        """
        queue: asyncio.Queue[str] = asyncio.Queue()
        async with self._lock:
            self._clients.setdefault(user_id, set()).add(queue)
        return queue

    async def disconnect(self, user_id: str, queue: asyncio.Queue[str]) -> None:
        """Remove a previously registered consumer.

        Args:
            user_id: Owner of the connection.
            queue: Queue returned by `connect`.
        """
        async with self._lock:
            consumers = self._clients.get(user_id)
            if consumers and queue in consumers:
                consumers.remove(queue)
                if not consumers:
                    self._clients.pop(user_id, None)

    async def emit(self, user_id: str, event: SSEEventSchema) -> int:
        """Deliver an event to all connections of a single user.

        Args:
            user_id: Target user identifier.
            event: Event payload.

        Returns:
            Number of connections that received the event.
        """
        payload = self._serialize(event)
        async with self._lock:
            consumers = list(self._clients.get(user_id, ()))
        for queue in consumers:
            await queue.put(payload)
        return len(consumers)

    async def broadcast(self, event: SSEEventSchema) -> int:
        """Deliver an event to every connected user.

        Args:
            event: Event payload.

        Returns:
            Total number of connections that received the event.
        """
        payload = self._serialize(event)
        async with self._lock:
            all_queues = [q for qs in self._clients.values() for q in qs]
        for queue in all_queues:
            await queue.put(payload)
        return len(all_queues)

    @staticmethod
    def _serialize(event: SSEEventSchema) -> str:
        """Serialize an SSE event to a JSON string with a generated message_id."""
        message_id = event.message_id or str(uuid.uuid4())
        body = event.model_dump() | {"message_id": message_id}
        return json.dumps(body, default=str)


sse_manager: SSEManager = SSEManager()


async def stream_events(user_id: str) -> AsyncIterator[dict[str, str]]:
    """Yield SSE events for a user's connection.

    Args:
        user_id: Authenticated user owning the stream.

    Yields:
        sse-starlette event dicts (`{"data": "..."}`) and periodic comments
        used as heartbeat to keep proxies alive.
    """
    queue = await sse_manager.connect(user_id)
    try:
        # send a comment so the connection is established immediately
        yield {"comment": "connected"}
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=25.0)
                yield {"data": data}
            except asyncio.TimeoutError:
                yield {"comment": "ping"}
    except asyncio.CancelledError:
        raise
    finally:
        await sse_manager.disconnect(user_id, queue)
```

**Por que `asyncio.Queue` por conexão:** desacopla quem produz (controllers) de quem consome (a connection). Cada cliente tem sua fila — se um for lento, não bloqueia os outros.

## Passo 9: Controllers

`src/controllers/webpush.py`:

```python
from src.core.errors import UnprocessableEntityError
from src.core.messages import (
    ERROR_REQUIRED_TITLE_BODY,
    SUCCESS_BROADCAST_SENT,
    SUCCESS_NOTIFICATION_SENT,
    SUCCESS_SUBSCRIBED,
    SUCCESS_UNSUBSCRIBED,
)
from src.db.repositories import SubscriptionRepository
from src.schemas import (
    MessageSchema,
    NotificationDataSchema,
    NotificationResultSchema,
    SubscriptionCreateSchema,
)
from src.services.webpush import WebPushService


class WebPushController:
    """Coordinates web push HTTP routes with the persistence and push services."""

    def __init__(self, repository: SubscriptionRepository) -> None:
        """Initialize the controller.

        Args:
            repository: Subscription repository.
        """
        self.repository: SubscriptionRepository = repository
        self.service: WebPushService = WebPushService(repository)

    async def subscribe(
        self,
        user_id: str,
        payload: SubscriptionCreateSchema,
    ) -> MessageSchema:
        """Persist a subscription for the authenticated user.

        Args:
            user_id: Authenticated user identifier.
            payload: Subscription payload from the browser.

        Returns:
            Status envelope confirming creation.
        """
        await self.repository.upsert(
            user_id=user_id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
        )
        return MessageSchema(status_code=201, detail=SUCCESS_SUBSCRIBED)

    async def unsubscribe_all(self, user_id: str) -> MessageSchema:
        """Remove every subscription for a user.

        Args:
            user_id: Authenticated user identifier.

        Returns:
            Status envelope confirming removal.
        """
        await self.repository.delete_all_by_user(user_id)
        return MessageSchema(status_code=200, detail=SUCCESS_UNSUBSCRIBED)

    async def delete_by_endpoint(self, endpoint: str) -> MessageSchema:
        """Remove a subscription by its endpoint URL.

        Args:
            endpoint: Push endpoint to remove.

        Returns:
            Status envelope confirming removal.
        """
        await self.repository.delete_by_endpoint(endpoint)
        return MessageSchema(status_code=200, detail=SUCCESS_UNSUBSCRIBED)

    async def notify_user(
        self,
        user_id: str,
        data: NotificationDataSchema,
    ) -> NotificationResultSchema:
        """Push a notification to a single user.

        Args:
            user_id: Target user identifier.
            data: Notification payload.

        Returns:
            Send result counts.

        Raises:
            UnprocessableEntityError: If `title` or `body` is missing.
        """
        if not data.title or not data.body:
            raise UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY)
        return await self.service.send_to_user(user_id, data)

    async def broadcast(
        self,
        data: NotificationDataSchema,
    ) -> NotificationResultSchema:
        """Broadcast a notification to all users.

        Args:
            data: Notification payload.

        Returns:
            Send result counts.

        Raises:
            UnprocessableEntityError: If `title` or `body` is missing.
        """
        if not data.title or not data.body:
            raise UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY)
        result = await self.service.broadcast(data)
        # success message stays semantic even when no subscriptions exist
        _ = SUCCESS_BROADCAST_SENT, SUCCESS_NOTIFICATION_SENT
        return result
```

`src/controllers/sse.py`:

```python
from src.core.errors import UnprocessableEntityError
from src.core.messages import (
    ERROR_REQUIRED_TYPE,
    SUCCESS_BROADCAST_SENT,
    SUCCESS_EVENT_EMITTED,
)
from src.schemas import MessageSchema, SSEEventSchema
from src.services.sse import sse_manager


class SSEController:
    """Coordinates SSE emit endpoints with the in-memory manager."""

    @staticmethod
    async def emit_to_user(user_id: str, event: SSEEventSchema) -> dict[str, int | str]:
        """Emit an event to all connections of one user.

        Args:
            user_id: Target user identifier.
            event: Event payload.

        Returns:
            Status envelope including delivery count.

        Raises:
            UnprocessableEntityError: If `event.type` is empty.
        """
        if not event.type:
            raise UnprocessableEntityError(ERROR_REQUIRED_TYPE)
        delivered = await sse_manager.emit(user_id, event)
        return {
            "status_code": 200,
            "detail": SUCCESS_EVENT_EMITTED,
            "delivered": delivered,
        }

    @staticmethod
    async def broadcast(event: SSEEventSchema) -> dict[str, int | str]:
        """Broadcast an event to every connected user.

        Args:
            event: Event payload.

        Returns:
            Status envelope including delivery count.

        Raises:
            UnprocessableEntityError: If `event.type` is empty.
        """
        if not event.type:
            raise UnprocessableEntityError(ERROR_REQUIRED_TYPE)
        delivered = await sse_manager.broadcast(event)
        # keep the constant import alive
        _ = MessageSchema  # used by other controllers; harmless here
        return {
            "status_code": 200,
            "detail": SUCCESS_BROADCAST_SENT,
            "delivered": delivered,
        }
```

`src/controllers/__init__.py`:

```python
from src.controllers.sse import SSEController
from src.controllers.webpush import WebPushController

__all__: list[str] = ["SSEController", "WebPushController"]
```

## Passo 10: Dependências e middlewares FastAPI

`src/api/dependencies/auth.py`:

```python
from typing import Annotated

from fastapi import Depends, Header

from src.core import settings
from src.core.errors import UnauthorizedError
from src.core.messages import ERROR_INVALID_API_KEY, ERROR_USER_NOT_AUTHENTICATED


async def require_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Extract the authenticated user_id from the Authorization header.

    Args:
        authorization: The incoming Authorization header value.

    Returns:
        The user identifier embedded in the bearer token.

    Raises:
        UnauthorizedError: If the header is missing or malformed.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError(ERROR_USER_NOT_AUTHENTICATED)
    # TODO produção: payload = jwt.decode(token, settings.JWT_SECRET); return payload["sub"]
    return authorization[7:].strip()


async def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="x-api-key")] = None,
) -> None:
    """Validate the internal x-api-key header.

    Args:
        x_api_key: The incoming x-api-key header value.

    Raises:
        UnauthorizedError: If the key is missing or does not match.
    """
    if not x_api_key or x_api_key != settings.WEBPUSH_API_KEY:
        raise UnauthorizedError(ERROR_INVALID_API_KEY)


CurrentUserId = Annotated[str, Depends(require_user_id)]
RequireApiKey = Annotated[None, Depends(require_api_key)]
```

`src/api/dependencies/db.py`:

```python
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.db.repositories import SubscriptionRepository

DBSession = Annotated[AsyncSession, Depends(get_session)]


async def get_subscription_repository(session: DBSession) -> SubscriptionRepository:
    """FastAPI dependency that yields a SubscriptionRepository.

    Args:
        session: Database session injected by FastAPI.

    Returns:
        Repository bound to the request session.
    """
    return SubscriptionRepository(session)


SubscriptionRepoDep = Annotated[
    SubscriptionRepository,
    Depends(get_subscription_repository),
]
```

`src/api/dependencies/__init__.py`:

```python
from src.api.dependencies.auth import (
    CurrentUserId,
    RequireApiKey,
    require_api_key,
    require_user_id,
)
from src.api.dependencies.db import (
    DBSession,
    SubscriptionRepoDep,
    get_subscription_repository,
)

__all__: list[str] = [
    "CurrentUserId",
    "DBSession",
    "RequireApiKey",
    "SubscriptionRepoDep",
    "get_subscription_repository",
    "require_api_key",
    "require_user_id",
]
```

`src/api/middlewares/error_handler.py`:

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.core.errors import ApiError


def register_error_handlers(app: FastAPI) -> None:
    """Register handlers that turn ApiError instances into JSON responses.

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(ApiError)
    async def _api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"status_code": exc.status_code, "detail": exc.detail},
        )
```

`src/api/middlewares/logger.py`:

```python
import logging
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

logger = logging.getLogger("api")


async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Log every request method/path. Wire as `app.middleware('http')`.

    Args:
        request: The incoming request.
        call_next: Next middleware/handler.

    Returns:
        The downstream response.
    """
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response
```

`src/api/middlewares/__init__.py`:

```python
from src.api.middlewares.error_handler import register_error_handlers
from src.api.middlewares.logger import log_requests

__all__: list[str] = ["log_requests", "register_error_handlers"]
```

## Passo 11: Routers

`src/api/routers/webpush.py`:

```python
from fastapi import APIRouter, Query

from src.api.dependencies import (
    CurrentUserId,
    RequireApiKey,
    SubscriptionRepoDep,
)
from src.controllers import WebPushController
from src.schemas import (
    MessageSchema,
    NotificationDataSchema,
    NotificationResultSchema,
    SubscriptionCreateSchema,
)

router = APIRouter(prefix="/webpush", tags=["webpush"])


@router.post("/subscription", status_code=201, response_model=MessageSchema)
async def subscribe(
    payload: SubscriptionCreateSchema,
    user_id: CurrentUserId,
    repo: SubscriptionRepoDep,
) -> MessageSchema:
    """Persist a Web Push subscription for the authenticated user."""
    return await WebPushController(repo).subscribe(user_id, payload)


@router.delete("/subscription", response_model=MessageSchema)
async def unsubscribe_all(
    user_id: CurrentUserId,
    repo: SubscriptionRepoDep,
) -> MessageSchema:
    """Remove every subscription owned by the authenticated user."""
    return await WebPushController(repo).unsubscribe_all(user_id)


@router.delete("/subscription/by-endpoint", response_model=MessageSchema)
async def delete_by_endpoint(
    _api_key: RequireApiKey,
    repo: SubscriptionRepoDep,
    endpoint: str = Query(..., description="Push endpoint URL to delete"),
) -> MessageSchema:
    """Internal: remove a single subscription by endpoint."""
    return await WebPushController(repo).delete_by_endpoint(endpoint)


@router.post("/notify/{user_id}", response_model=NotificationResultSchema)
async def notify_user(
    user_id: str,
    data: NotificationDataSchema,
    _api_key: RequireApiKey,
    repo: SubscriptionRepoDep,
) -> NotificationResultSchema:
    """Internal: send a notification to all devices of a user."""
    return await WebPushController(repo).notify_user(user_id, data)


@router.post("/notify", response_model=NotificationResultSchema)
async def broadcast(
    data: NotificationDataSchema,
    _api_key: RequireApiKey,
    repo: SubscriptionRepoDep,
) -> NotificationResultSchema:
    """Internal: broadcast a notification to all subscribed devices."""
    return await WebPushController(repo).broadcast(data)
```

`src/api/routers/sse.py`:

```python
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from src.api.dependencies import CurrentUserId, RequireApiKey
from src.controllers import SSEController
from src.schemas import SSEEventSchema
from src.services.sse import stream_events

router = APIRouter(prefix="/sse", tags=["sse"])


@router.get("/stream")
async def stream(user_id: CurrentUserId) -> EventSourceResponse:
    """Open a persistent SSE connection authenticated via Bearer token."""
    return EventSourceResponse(stream_events(user_id))


@router.post("/emit/broadcast")
async def emit_broadcast(
    event: SSEEventSchema,
    _api_key: RequireApiKey,
) -> dict[str, int | str]:
    """Internal: broadcast an SSE event to every connected user."""
    return await SSEController.broadcast(event)


@router.post("/emit/{user_id}")
async def emit_to_user(
    user_id: str,
    event: SSEEventSchema,
    _api_key: RequireApiKey,
) -> dict[str, int | str]:
    """Internal: emit an SSE event to a single user."""
    return await SSEController.emit_to_user(user_id, event)
```

`src/api/routers/__init__.py`:

```python
from src.api.routers.sse import router as sse_router
from src.api.routers.webpush import router as webpush_router

__all__: list[str] = ["sse_router", "webpush_router"]
```

**Por que SSE com `sse-starlette`:** ele cuida do framing correto (`data:`, `id:`, `event:`, `retry:`, comentários `:`) e do `media_type: text/event-stream`. Você só precisa retornar um async iterator de dicts. O heartbeat manual em `stream_events` fica visível e ajustável.

## Passo 12: App factory + entrypoint

`src/api/app.py`:

```python
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middlewares import log_requests, register_error_handlers
from src.api.routers import sse_router, webpush_router
from src.core import settings
from src.db import init_db


def create_app() -> FastAPI:
    """Build the FastAPI application instance.

    Returns:
        The configured FastAPI application.
    """
    logging.basicConfig(level=logging.INFO)

    app = FastAPI(
        title="PWA Backend — Web Push + SSE",
        version="0.1.0",
        description="API que persiste inscrições webpush e emite eventos SSE.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware("http")(log_requests)
    register_error_handlers(app)

    app.include_router(webpush_router)
    app.include_router(sse_router)

    @app.get("/")
    async def root() -> dict[str, str | int]:
        """Health endpoint."""
        return {"status_code": 200, "detail": "API Running!"}

    @app.on_event("startup")
    async def _startup() -> None:
        """Run database migrations at startup (SQLite friendly)."""
        await init_db()
        logger = logging.getLogger("api")
        logger.info("VAPID pública: %s", settings.VAPID_PUBLIC_KEY)

    return app


app: FastAPI = create_app()
```

`src/server.py`:

```python
import uvicorn

from src.core import settings


def dev() -> None:
    """Entry point for development with auto-reload."""
    uvicorn.run(
        "src.api.app:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
    )


def start() -> None:
    """Entry point for production."""
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=settings.PORT)


if __name__ == "__main__":
    dev()
```

## Passo 13: Rodar e testar

```bash
poetry run dev
```

Saída esperada:

```text
INFO:     Uvicorn running on http://0.0.0.0:3001
INFO:     Started reloader process
INFO:     Application startup complete.
INFO:     api: VAPID pública: BKxxx...
```

Os mesmos `curl` do guia Node funcionam — a interface é idêntica:

```bash
curl -X POST http://localhost:3001/webpush/subscription \
  -H "Authorization: Bearer user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/dummy",
    "keys": { "p256dh": "BKxxx", "auth": "yyy" }
  }'

curl -N http://localhost:3001/sse/stream \
  -H "Authorization: Bearer user-123"

curl -X POST http://localhost:3001/sse/emit/user-123 \
  -H "x-api-key: troque-esta-chave-em-prod" \
  -H "Content-Type: application/json" \
  -d '{"type":"chat-message","payload":{"text":"oi"}}'
```

Acesse também o Swagger automático em `http://localhost:3001/docs`.

## Endpoints — referência rápida

| Método | Path | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/webpush/subscription` | Bearer | Salva subscription do usuário |
| `DELETE` | `/webpush/subscription` | Bearer | Remove todas do usuário |
| `DELETE` | `/webpush/subscription/by-endpoint?endpoint=...` | x-api-key | Remove uma específica (interno) |
| `POST` | `/webpush/notify/{user_id}` | x-api-key | Push para um usuário |
| `POST` | `/webpush/notify` | x-api-key | Broadcast |
| `GET` | `/sse/stream` | Bearer | Conexão SSE |
| `POST` | `/sse/emit/{user_id}` | x-api-key | Emit SSE para usuário |
| `POST` | `/sse/emit/broadcast` | x-api-key | Broadcast SSE |

## Próximos passos (produção)

- Trocar Bearer plain por **JWT** (`pyjwt` ou `python-jose`).
- Migrar SQLite → **PostgreSQL** com `asyncpg`. O `on_conflict_do_update` precisa de `dialects.postgresql.insert`.
- Adicionar **Alembic** para migrations versionadas.
- Adicionar **Redis pub/sub** para SSE multi-instância — substitua o `dict` em `SSEManager` por `aioredis.subscribe`.
- Adicionar **rate limiting** com `slowapi` (20 req/s por IP, como o `transport-backend`).
- Adicionar **healthcheck** `/health` separado da raiz (raiz é semântica, health é pra orquestrador).

Próximo: [Frontend](./03-frontend.md).
