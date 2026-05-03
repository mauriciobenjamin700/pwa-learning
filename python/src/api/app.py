import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middlewares import log_requests, register_error_handlers
from src.api.routers import sse_router, webpush_router
from src.core import settings
from src.db import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Run startup and shutdown tasks for the FastAPI application.

    Args:
        _app: The FastAPI application instance (unused).

    Yields:
        Control back to FastAPI while the app is running.
    """
    await init_db()
    logger = logging.getLogger("api")
    logger.info("VAPID pública: %s", settings.VAPID_PUBLIC_KEY)
    yield


def create_app() -> FastAPI:
    """Build the FastAPI application instance.

    Returns:
        The configured FastAPI application.
    """
    logging.basicConfig(level=logging.INFO)

    app = FastAPI(
        title="PWA Backend — Web Push + SSE",
        version="0.1.0",
        description="API que persiste inscrições webpush e emite eventos SSE.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware("http")(log_requests)
    register_error_handlers(app)

    app.include_router(webpush_router)
    app.include_router(sse_router)

    @app.get("/")
    async def root() -> dict[str, int | str]:
        """Health endpoint."""
        return {"status_code": 200, "detail": "API Running!"}

    return app


app: FastAPI = create_app()
