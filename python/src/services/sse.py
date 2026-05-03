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
        """Serialize an SSE event to a JSON string with a generated message_id.

        Args:
            event: Event payload.

        Returns:
            JSON string ready to be sent over SSE.
        """
        message_id = event.message_id or str(uuid.uuid4())
        body = event.model_dump() | {"message_id": message_id}
        return json.dumps(body, default=str)


sse_manager: SSEManager = SSEManager()


async def stream_events(user_id: str) -> AsyncIterator[dict[str, str]]:
    """Yield SSE events for a user's connection.

    Args:
        user_id: Authenticated user owning the stream.

    Yields:
        sse-starlette event dicts ({"data": "..."}) and periodic comments
        used as heartbeat to keep proxies alive.
    """
    queue = await sse_manager.connect(user_id)
    try:
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
