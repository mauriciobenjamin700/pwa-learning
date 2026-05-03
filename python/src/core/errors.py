class ApiError(Exception):
    """Base API exception with HTTP status code and JSON-friendly detail."""

    def __init__(self, status_code: int, detail: str) -> None:
        """Initialize the API error.

        Args:
            status_code: HTTP status code.
            detail: Human-readable error message.
        """
        self.status_code: int = status_code
        self.detail: str = detail
        super().__init__(detail)


class BadRequestError(ApiError):
    """400 Bad Request."""

    def __init__(self, detail: str = "Requisição inválida") -> None:
        """Initialize the bad request error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(400, detail)


class UnauthorizedError(ApiError):
    """401 Unauthorized."""

    def __init__(self, detail: str = "Não autenticado") -> None:
        """Initialize the unauthorized error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(401, detail)


class ForbiddenError(ApiError):
    """403 Forbidden."""

    def __init__(self, detail: str = "Acesso negado") -> None:
        """Initialize the forbidden error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(403, detail)


class NotFoundError(ApiError):
    """404 Not Found."""

    def __init__(self, detail: str = "Recurso não encontrado") -> None:
        """Initialize the not found error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(404, detail)


class ConflictError(ApiError):
    """409 Conflict."""

    def __init__(self, detail: str = "Conflito") -> None:
        """Initialize the conflict error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(409, detail)


class UnprocessableEntityError(ApiError):
    """422 Unprocessable Entity."""

    def __init__(self, detail: str = "Erro de validação") -> None:
        """Initialize the unprocessable entity error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(422, detail)


class InternalServerError(ApiError):
    """500 Internal Server Error."""

    def __init__(self, detail: str = "Erro interno do servidor") -> None:
        """Initialize the internal server error.

        Args:
            detail: Human-readable error message.
        """
        super().__init__(500, detail)
