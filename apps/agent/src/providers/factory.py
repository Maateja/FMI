from src.core.config import agent_settings
from src.core.logging import agent_logger
from src.providers.base import LLMProvider, STTProvider, TTSProvider
from src.providers.llm.gemini import GeminiLLM, GroqLlamaLLM, MockLLM
from src.providers.stt.groq_whisper import GroqWhisperSTT, MockSTT
from src.providers.tts.kokoro import KokoroTTS, MockTTS


def get_stt_provider() -> STTProvider:
    provider_name = agent_settings.STT_PROVIDER.lower()
    if provider_name == "groq_whisper":
        return GroqWhisperSTT()
    elif provider_name == "mock":
        return MockSTT()
    else:
        agent_logger.warning("Unknown STT provider, falling back to mock", provider=provider_name)
        return MockSTT()


def get_llm_provider() -> LLMProvider:
    provider_name = agent_settings.LLM_PROVIDER.lower()
    if provider_name == "gemini":
        return GeminiLLM()
    elif provider_name == "groq_llama":
        return GroqLlamaLLM()
    elif provider_name == "mock":
        return MockLLM()
    else:
        agent_logger.warning("Unknown LLM provider, falling back to mock", provider=provider_name)
        return MockLLM()


def get_tts_provider() -> TTSProvider:
    provider_name = agent_settings.TTS_PROVIDER.lower()
    if provider_name == "kokoro":
        return KokoroTTS()
    elif provider_name == "mock":
        return MockTTS()
    else:
        agent_logger.warning("Unknown TTS provider, falling back to mock", provider=provider_name)
        return MockTTS()
