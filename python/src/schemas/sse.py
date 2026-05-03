from typing import Any

from pydantic import BaseModel


class SSEEventSchema(BaseModel):
    """Event broadcast over the SSE channel."""

    type: str
    payload: Any
    message_id: str | None = None
