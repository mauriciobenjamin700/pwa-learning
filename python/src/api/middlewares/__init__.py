from src.api.middlewares.error_handler import register_error_handlers
from src.api.middlewares.logger import log_requests

__all__: list[str] = ["log_requests", "register_error_handlers"]
