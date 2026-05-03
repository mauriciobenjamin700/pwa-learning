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
    return json.dumps(
        {
            "title": data.title,
            "body": data.body,
            "icon": data.icon or "/pwa-192x192.png",
            "badge": data.badge or "/pwa-192x192.png",
            "image": data.image,
            "vibrate": data.vibrate,
            "requireInteraction": data.requireInteraction,
            "tag": data.tag,
            "data": {"url": data.url or "/"},
        }
    )


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
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
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
