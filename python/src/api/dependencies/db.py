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
