from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True,
        str_strip_whitespace=True,
    )

    PORT: int = 3001
    NODE_ENV: str = "development"

    VAPID_EMAIL: str
    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    WEBPUSH_API_KEY: str

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/subscriptions.db"


settings: Settings = Settings()  # type: ignore[call-arg]
