from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core import settings
from src.db.base import Base


def _ensure_db_dir(database_url: str) -> None:
    """Ensure the SQLite parent directory exists.

    Args:
        database_url: SQLAlchemy URL like 'sqlite+aiosqlite:///./data/foo.db'.
    """
    if "sqlite" not in database_url:
        return
    path_part = database_url.split("///", maxsplit=1)[-1]
    db_path = Path(path_part)
    db_path.parent.mkdir(parents=True, exist_ok=True)


_ensure_db_dir(settings.DATABASE_URL)

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Create all tables. For production use Alembic migrations instead."""
    # Import models so SQLAlchemy registers them on metadata before create_all.
    import src.db.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session for FastAPI dependency injection.

    Yields:
        AsyncSession: Active SQLAlchemy async session.
    """
    async with async_session_maker() as session:
        yield session
