import time
from collections.abc import AsyncIterator

import httpx

from src.core.config import agent_settings
from src.core.logging import agent_logger
from src.providers.base import AudioChunk, TTSProvider


class KokoroTTS(TTSProvider):
    """
    TTS Provider connecting to local or containerized Kokoro-FastAPI.
    Uses OpenAI-compatible /v1/audio/speech endpoint with ultra-low latency audio chunks.
    """

    def __init__(
        self,
        api_url: str | None = None,
        voice: str | None = None,
    ) -> None:
        self.api_url = (api_url or agent_settings.KOKORO_API_URL).rstrip("/")
        self.voice = voice or agent_settings.KOKORO_VOICE
        self.endpoint = f"{self.api_url}/audio/speech"

    async def synthesize_stream(
        self,
        text_stream: AsyncIterator[str],
        voice: str | None = None,
    ) -> AsyncIterator[AudioChunk]:
        full_text_parts = []
        async for chunk in text_stream:
            full_text_parts.append(chunk)

        full_text = "".join(full_text_parts).strip()
        if not full_text:
            return

        payload = {
            "model": "kokoro",
            "input": full_text,
            "voice": voice or self.voice,
            "response_format": "pcm",
        }

        start_time = time.perf_counter()
        try:
            async with (
                httpx.AsyncClient(timeout=10.0) as client,
                client.stream("POST", self.endpoint, json=payload) as response,
            ):
                if response.status_code != 200:
                    agent_logger.warning("Kokoro server error, falling back to mock audio")
                    yield AudioChunk(data=b"\x00" * 2400, sample_rate=24000, is_final=True)
                    return

                first_chunk = True
                async for raw_bytes in response.aiter_bytes(chunk_size=4096):
                    if first_chunk:
                        latency_ms = (time.perf_counter() - start_time) * 1000
                        agent_logger.info(
                            "Kokoro TTS first audio chunk received",
                            latency_ms=round(latency_ms, 2),
                        )
                        first_chunk = False
                    yield AudioChunk(data=raw_bytes, sample_rate=24000, is_final=False)

                yield AudioChunk(data=b"", sample_rate=24000, is_final=True)

        except (httpx.HTTPError, OSError) as exc:
            agent_logger.warning(
                "Could not connect to Kokoro server, using mock audio stream",
                error=str(exc),
            )
            yield AudioChunk(data=b"\x00" * 4800, sample_rate=24000, is_final=True)


class MockTTS(TTSProvider):
    """
    Deterministic Mock TTS for latency benchmarking and tests.
    Generates simulated PCM audio chunks at 24kHz.
    """

    def __init__(self, sample_rate: int = 24000) -> None:
        self.sample_rate = sample_rate

    async def synthesize_stream(
        self,
        text_stream: AsyncIterator[str],
        voice: str | None = None,
    ) -> AsyncIterator[AudioChunk]:
        collected = []
        async for part in text_stream:
            collected.append(part)

        chunk_size = 2400
        for _ in range(5):
            yield AudioChunk(
                data=b"\x00\x01" * (chunk_size // 2),
                sample_rate=self.sample_rate,
                is_final=False,
            )

        yield AudioChunk(
            data=b"",
            sample_rate=self.sample_rate,
            is_final=True,
        )
