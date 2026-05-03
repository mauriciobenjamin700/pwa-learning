from src.core.errors import UnprocessableEntityError
from src.core.messages import (
    ERROR_REQUIRED_TYPE,
    SUCCESS_BROADCAST_SENT,
    SUCCESS_EVENT_EMITTED,
)
from src.schemas import SSEEventSchema
from src.services.sse import sse_manager


class SSEController:
    """Coordinates SSE emit endpoints with the in-memory manager."""

    @staticmethod
    async def emit_to_user(
        user_id: str,
        event: SSEEventSchema,
    ) -> dict[str, int | str]:
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
        return {
            "status_code": 200,
            "detail": SUCCESS_BROADCAST_SENT,
            "delivered": delivered,
        }
