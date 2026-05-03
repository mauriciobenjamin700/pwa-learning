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
