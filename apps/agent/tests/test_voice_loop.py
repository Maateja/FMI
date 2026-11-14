import pytest

from src.agent import VoiceLoopAgent
from src.providers.factory import get_llm_provider, get_stt_provider, get_tts_provider
from src.providers.llm.gemini import MockLLM
from src.providers.stt.groq_whisper import MockSTT
from src.providers.tts.kokoro import MockTTS


def test_provider_factory():
    stt = get_stt_provider()
    llm = get_llm_provider()
    tts = get_tts_provider()
    assert stt is not None
    assert llm is not None
    assert tts is not None


@pytest.mark.asyncio
async def test_voice_loop_round_trip():
    stt = MockSTT(predefined_text="I implemented JWT authentication with refresh tokens.")
    llm = MockLLM(default_response="How do you handle token revocation before expiry?")
    tts = MockTTS()

    agent = VoiceLoopAgent(stt=stt, llm=llm, tts=tts)
    assert agent.state == "idle"

    # Run complete voice round-trip
    metrics = await agent.run_round_trip(b"\x00" * 1600)

    assert metrics["user_transcript"] == "I implemented JWT authentication with refresh tokens."
    assert metrics["ai_response"] == "How do you handle token revocation before expiry?"
    assert metrics["stt_latency_ms"] >= 0.0
    assert metrics["llm_latency_ms"] >= 0.0
    assert metrics["time_to_first_audio_ms"] > 0.0
    assert metrics["audio_bytes_produced"] > 0
    assert metrics["was_interrupted"] is False
    assert agent.state == "listening"


def test_voice_loop_interruption():
    stt = MockSTT(predefined_text="Wait, let me explain.")
    llm = MockLLM(default_response="This is a long sentence that should get interrupted by the candidate.")
    tts = MockTTS()

    agent = VoiceLoopAgent(stt=stt, llm=llm, tts=tts)
    agent.set_state("speaking")
    assert agent.state == "speaking"

    # Candidate speaks while interviewer is speaking
    agent.handle_user_interruption()

    assert agent.is_interrupted is True
    assert agent.state == "listening"
