import logging
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

logger = logging.getLogger("api")


async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Log every request method/path. Wire as `app.middleware('http')`.

    Args:
        request: The incoming request.
        call_next: Next middleware/handler.

    Returns:
        The downstream response.
    """
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response
