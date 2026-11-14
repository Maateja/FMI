from src.core.config import AgentSettings
from src.providers.base import AudioChunk, LLMMessage, TranscriptChunk


def test_agent_settings():
    settings = AgentSettings(
        LIVEKIT_URL="ws://localhost:7880",
        LIVEKIT_API_KEY="devkey",
        LIVEKIT_API_SECRET="secret",
        STT_PROVIDER="groq_whisper",
        LLM_PROVIDER="gemini",
        TTS_PROVIDER="kokoro",
    )
    assert settings.STT_PROVIDER == "groq_whisper"
    assert settings.LLM_PROVIDER == "gemini"
    assert settings.TTS_PROVIDER == "kokoro"
    assert settings.LIVEKIT_URL == "ws://localhost:7880"


def test_provider_base_models():
    msg = LLMMessage(role="system", content="You are a warm, professional interviewer.")
    assert msg.role == "system"
    assert "interviewer" in msg.content

    chunk = TranscriptChunk(text="Hello world", is_final=True, start_time=0.5, end_time=1.2)
    assert chunk.text == "Hello world"
    assert chunk.is_final is True
    assert chunk.start_time == 0.5

    audio = AudioChunk(data=b"\x00\x01\x02", sample_rate=24000, is_final=False)
    assert len(audio.data) == 3
    assert audio.sample_rate == 24000
