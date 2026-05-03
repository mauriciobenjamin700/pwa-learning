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
