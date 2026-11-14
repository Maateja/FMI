import io
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx

from src.core.config import agent_settings
from src.core.logging import agent_logger
from src.providers.base import STTProvider, TranscriptChunk


class GroqWhisperSTT(STTProvider):
    """
    STT Provider using Groq's high-speed Whisper Large v3 Turbo API.
    Near-$0 free tier with sub-second turnaround.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or agent_settings.GROQ_API_KEY
        self.model = model or agent_settings.GROQ_WHISPER_MODEL
        self.endpoint = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe_stream(
        self, audio_stream: AsyncIterator[bytes]
    ) -> AsyncIterator[TranscriptChunk]:
        """
        Collects streaming audio chunks and transcribes the finalized segment.
        """
        buffer = bytearray()
        async for chunk in audio_stream:
            buffer.extend(chunk)

        if buffer:
            result = await self.transcribe_file(bytes(buffer))
            yield result

    async def transcribe_file(self, audio_bytes: bytes) -> TranscriptChunk:
        start_time = time.perf_counter()

        # If dummy placeholder key is used in dev, fall back gracefully to mock
        if self.api_key.startswith("placeholder"):
            agent_logger.warning("Using mock STT because GROQ_API_KEY is a placeholder")
            return TranscriptChunk(
                text="I have built several projects using React and Node.js.",
                is_final=True,
                start_time=0.0,
                end_time=1.5,
                words=[
                    {"word": "I", "start": 0.0, "end": 0.1},
                    {"word": "have", "start": 0.1, "end": 0.3},
                    {"word": "built", "start": 0.3, "end": 0.6},
                    {"word": "projects", "start": 0.6, "end": 1.2},
                ],
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        files: dict[str, Any] = {
            "file": ("audio.wav", io.BytesIO(audio_bytes), "audio/wav"),
            "model": (None, self.model),
            "response_format": (None, "verbose_json"),
            "language": (None, "en"),
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(self.endpoint, headers=headers, files=files)
            response.raise_for_status()
            data = response.json()

        latency_ms = (time.perf_counter() - start_time) * 1000
        agent_logger.info("Groq Whisper STT transcribed", latency_ms=round(latency_ms, 2))

        words = []
        for w in data.get("words", []):
            words.append({
                "word": w.get("word", ""),
                "start": float(w.get("start", 0.0)),
                "end": float(w.get("end", 0.0)),
            })

        return TranscriptChunk(
            text=data.get("text", "").strip(),
            is_final=True,
            start_time=0.0,
            end_time=float(data.get("duration", 0.0)),
            words=words,
        )


class MockSTT(STTProvider):
    """Zero-dependency Mock STT for automated tests and offline development."""

    def __init__(self, predefined_text: str = "I understand the concept of closures in JavaScript.") -> None:
        self.predefined_text = predefined_text

    async def transcribe_stream(
        self, audio_stream: AsyncIterator[bytes]
    ) -> AsyncIterator[TranscriptChunk]:
        async for _ in audio_stream:
            pass
        yield await self.transcribe_file(b"")

    async def transcribe_file(self, audio_bytes: bytes) -> TranscriptChunk:
        words = [
            {"word": w, "start": i * 0.3, "end": (i + 1) * 0.3}
            for i, w in enumerate(self.predefined_text.split())
        ]
        return TranscriptChunk(
            text=self.predefined_text,
            is_final=True,
            start_time=0.0,
            end_time=len(words) * 0.3,
            words=words,
        )
