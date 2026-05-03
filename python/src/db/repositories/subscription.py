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
        """Create or replace a subscription bound to the (endpoint) unique key.

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
