import uvicorn

from src.core import settings


def dev() -> None:
    """Entry point for development with auto-reload."""
    uvicorn.run(
        "src.api.app:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
    )


def start() -> None:
    """Entry point for production."""
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=settings.PORT)


if __name__ == "__main__":
    dev()
