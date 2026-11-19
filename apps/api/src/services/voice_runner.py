import base64
import math
import struct
import time

import httpx
from pydantic import BaseModel

from src.core.config import settings
from src.core.logging import logger
from src.services.interview_state import get_or_create_session


class VoiceRoundTripResponse(BaseModel):
    user_transcript: str
    ai_response: str
    stt_latency_ms: float
    llm_latency_ms: float
    time_to_first_audio_ms: float
    total_round_trip_ms: float
    audio_base64: str
    audio_mime_type: str = "audio/wav"
    was_interrupted: bool = False
    round: str = "technical"
    question_index: int = 1
    total_questions: int = 4
    is_follow_up: bool = False
    follow_up_count: int = 0
    max_follow_ups: int = 2
    quality_score: int = 75
    is_completed: bool = False
    turn_number: int = 1


async def run_voice_round_trip(
    audio_bytes: bytes,
    target_role: str = "Frontend Developer",
    interview_id: str | None = None,
    user_id: str = "default-user",
    user_transcript_override: str | None = None,
) -> VoiceRoundTripResponse:
    """
    Executes a high-speed voice round-trip integrated with Phase 4 State Machine:
    1. STT: Transcribe user audio (via Groq Whisper, client override, or fallback).
    2. Adaptive Probing & State Machine: Evaluates response completeness, determines
       whether to ask follow-up 1 or 2, or advance round.
    3. TTS: Synthesize interviewer audio (via Kokoro or fallback).
    4. Turn Persistence: Persists turn record to database.
    """
    t_start = time.perf_counter()

    # 1. STT Step
    t_stt_start = time.perf_counter()
    transcript = (
        user_transcript_override.strip()
        if user_transcript_override and user_transcript_override.strip()
        else "I have experience with React hooks and optimizing web app re-renders."
    )

    groq_key = settings.__dict__.get("GROQ_API_KEY", "")
    if not user_transcript_override and len(audio_bytes) > 1000 and groq_key and not groq_key.startswith("placeholder"):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                files_payload: list[tuple[str, tuple[str | None, bytes | str, str | None]]] = [
                    ("file", ("audio.wav", audio_bytes, "audio/wav")),
                    ("model", (None, "whisper-large-v3-turbo", None)),
                    ("language", (None, "en", None)),
                ]
                res = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {groq_key}"},
                    files=files_payload,
                )
                if res.status_code == 200:
                    transcript = res.json().get("text", transcript).strip()
        except Exception as e:
            logger.warning(f"Live STT failed, using fallback transcript: {e}")

    t_stt_end = time.perf_counter()
    stt_latency_ms = (t_stt_end - t_stt_start) * 1000

    # 2. Phase 4 State Machine & Adaptive Probing
    t_llm_start = time.perf_counter()

    session_id = interview_id or "default-session"
    session = get_or_create_session(
        interview_id=session_id,
        user_id=user_id,
        target_role=target_role,
    )

    progression = await session.evaluate_and_advance(
        user_transcript=transcript,
        speech_metrics={
            "stt_ms": round(stt_latency_ms, 2),
            "duration_seconds": round(len(audio_bytes) / 32000.0, 2) if audio_bytes else 1.5,
            "words_count": len(transcript.split()),
        },
    )

    ai_response = str(progression["ai_next_speech"])
    t_llm_end = time.perf_counter()
    llm_latency_ms = (t_llm_end - t_llm_start) * 1000

    # 3. TTS Step (Kokoro or PCM WAV generator)
    synthetic_wav: bytes

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.post(
                "http://localhost:8880/v1/audio/speech",
                json={
                    "model": "kokoro",
                    "input": ai_response,
                    "voice": "af_heart",
                    "response_format": "wav",
                },
            )
            synthetic_wav = res.content if res.status_code == 200 else _generate_pcm_wav()
    except Exception:
        synthetic_wav = _generate_pcm_wav()

    t_first_audio_ms = (time.perf_counter() - t_start) * 1000
    t_total_ms = (time.perf_counter() - t_start) * 1000

    return VoiceRoundTripResponse(
        user_transcript=transcript,
        ai_response=ai_response,
        stt_latency_ms=round(stt_latency_ms, 2),
        llm_latency_ms=round(llm_latency_ms, 2),
        time_to_first_audio_ms=round(t_first_audio_ms, 2),
        total_round_trip_ms=round(t_total_ms, 2),
        audio_base64=base64.b64encode(synthetic_wav).decode("ascii"),
        audio_mime_type="audio/wav",
        was_interrupted=False,
        round=str(progression.get("round", "technical")),
        question_index=int(progression.get("question_index", 1)),
        total_questions=int(progression.get("total_questions", 4)),
        is_follow_up=bool(progression.get("is_follow_up", False)),
        follow_up_count=int(progression.get("follow_up_count", 0)),
        max_follow_ups=int(progression.get("max_follow_ups", 2)),
        quality_score=int(progression.get("quality_score", 75)),
        is_completed=bool(progression.get("is_completed", False)),
        turn_number=int(progression.get("turn_number", 1)),
    )


def _generate_pcm_wav(duration_seconds: float = 1.5, sample_rate: int = 16000) -> bytes:
    """Generates a valid 16-bit PCM WAV header and gentle sine tone for testing."""
    num_samples = int(sample_rate * duration_seconds)
    audio_data = bytearray()
    for i in range(num_samples):
        t = float(i) / sample_rate
        sample = int(32767.0 * 0.15 * math.sin(2.0 * math.pi * 440.0 * t))
        audio_data.extend(struct.pack("<h", sample))

    header = bytearray()
    header.extend(b"RIFF")
    header.extend(struct.pack("<I", 36 + len(audio_data)))
    header.extend(b"WAVE")
    header.extend(b"fmt ")
    header.extend(struct.pack("<I", 16))
    header.extend(struct.pack("<H", 1))  # PCM
    header.extend(struct.pack("<H", 1))  # Mono
    header.extend(struct.pack("<I", sample_rate))
    header.extend(struct.pack("<I", sample_rate * 2))  # Byte rate
    header.extend(struct.pack("<H", 2))  # Block align
    header.extend(struct.pack("<H", 16))  # Bits per sample
    header.extend(b"data")
    header.extend(struct.pack("<I", len(audio_data)))

    return bytes(header + audio_data)
