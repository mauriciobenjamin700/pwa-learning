from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.core.errors import ApiError


def register_error_handlers(app: FastAPI) -> None:
    """Register handlers that turn ApiError instances into JSON responses.

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(ApiError)
    async def _api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
        """Convert an ApiError into a typed JSON response.

        Args:
            _request: Incoming request (unused).
            exc: The raised ApiError.

        Returns:
            JSONResponse with the error's status_code and detail.
        """
        return JSONResponse(
            status_code=exc.status_code,
            content={"status_code": exc.status_code, "detail": exc.detail},
        )
