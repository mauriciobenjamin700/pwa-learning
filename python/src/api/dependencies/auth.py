from typing import Annotated

from fastapi import Depends, Header

from src.core import settings
from src.core.errors import UnauthorizedError
from src.core.messages import ERROR_INVALID_API_KEY, ERROR_USER_NOT_AUTHENTICATED


async def require_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Extract the authenticated user_id from the Authorization header.

    Args:
        authorization: The incoming Authorization header value.

    Returns:
        The user identifier embedded in the bearer token.

    Raises:
        UnauthorizedError: If the header is missing or malformed.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError(ERROR_USER_NOT_AUTHENTICATED)
    # TODO produção: payload = jwt.decode(token, settings.JWT_SECRET); return payload["sub"]
    return authorization[7:].strip()


async def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="x-api-key")] = None,
) -> None:
    """Validate the internal x-api-key header.

    Args:
        x_api_key: The incoming x-api-key header value.

    Raises:
        UnauthorizedError: If the key is missing or does not match.
    """
    if not x_api_key or x_api_key != settings.WEBPUSH_API_KEY:
        raise UnauthorizedError(ERROR_INVALID_API_KEY)


CurrentUserId = Annotated[str, Depends(require_user_id)]
RequireApiKey = Annotated[None, Depends(require_api_key)]
