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
