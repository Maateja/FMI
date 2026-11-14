import pytest

from src.services.voice_runner import run_voice_round_trip


@pytest.mark.asyncio
async def test_voice_runner_round_trip():
    # Run voice round trip with synthetic input
    res = await run_voice_round_trip(b"\x00" * 1200, target_role="Frontend Developer")

    assert res.user_transcript is not None
    assert len(res.user_transcript) > 0
    assert res.ai_response is not None
    assert len(res.ai_response) > 0
    assert res.stt_latency_ms >= 0.0
    assert res.llm_latency_ms >= 0.0
    assert res.time_to_first_audio_ms > 0.0
    assert res.total_round_trip_ms > 0.0
    assert len(res.audio_base64) > 100
