from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secretsecretsecretsecretsecretsecretsecret"
    API_BASE_URL: str = "http://localhost:8000/api/v1"
    INTERNAL_API_SECRET: str = "agent-internal-secret-token"

    # Providers
    STT_PROVIDER: str = "groq_whisper"
    LLM_PROVIDER: str = "gemini"
    TTS_PROVIDER: str = "kokoro"
    VAD_PROVIDER: str = "silero"

    # API Keys & Endpoints
    GEMINI_API_KEY: str = "placeholder-gemini-key"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GROQ_API_KEY: str = "placeholder-groq-key"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"
    KOKORO_API_URL: str = "http://localhost:8880/v1"
    KOKORO_VOICE: str = "af_heart"

    AI_TRAINING_NOTICE_ACKNOWLEDGED: bool = True


agent_settings = AgentSettings()

