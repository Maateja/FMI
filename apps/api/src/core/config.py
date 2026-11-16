
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Supabase
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: str = "placeholder-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-role-key"
    SUPABASE_JWT_SECRET: str = "super-secret-jwt-token-with-at-least-32-characters-long"

    # LiveKit
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secretsecretsecretsecretsecretsecretsecret"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Internal API Secret for Agent
    INTERNAL_API_SECRET: str = "agent-internal-secret-token"


settings = Settings()
