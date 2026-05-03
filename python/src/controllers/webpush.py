from src.core.errors import UnprocessableEntityError
from src.core.messages import (
    ERROR_REQUIRED_TITLE_BODY,
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
    """Coordinates Web Push HTTP routes with persistence and push services."""

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
        return await self.service.broadcast(data)
