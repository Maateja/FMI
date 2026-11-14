from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any

from pydantic import BaseModel


class TranscriptChunk(BaseModel):
    text: str
    is_final: bool = False
    start_time: float = 0.0
    end_time: float = 0.0
    words: list[dict[str, Any]] = []


class LLMMessage(BaseModel):
    role: str  # 'system' | 'user' | 'assistant'
    content: str


class AudioChunk(BaseModel):
    data: bytes
    sample_rate: int = 24000
    is_final: bool = False


class STTProvider(ABC):
    """Abstract interface for Speech-to-Text providers (Whisper, Deepgram, etc.)."""

    @abstractmethod
    def transcribe_stream(
        self, audio_stream: AsyncIterator[bytes]
    ) -> AsyncIterator[TranscriptChunk]:
        """Streams incoming audio bytes and yields transcript chunks."""
        raise NotImplementedError

    @abstractmethod
    async def transcribe_file(self, audio_bytes: bytes) -> TranscriptChunk:
        """Transcribes a discrete audio buffer."""
        raise NotImplementedError


class LLMProvider(ABC):
    """Abstract interface for Language Model providers (Gemini, Groq Llama, Claude, etc.)."""

    @abstractmethod
    async def generate_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 250,
    ) -> str:
        """Generates a complete textual response."""
        raise NotImplementedError

    @abstractmethod
    def stream_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        """Streams textual tokens as they are produced."""
        raise NotImplementedError

    @abstractmethod
    async def evaluate_structured(
        self,
        prompt: str,
        output_schema: type[BaseModel],
    ) -> BaseModel:
        """Evaluates interview content into a strictly typed Pydantic model."""
        raise NotImplementedError


class TTSProvider(ABC):
    """Abstract interface for Text-to-Speech providers (Kokoro, Piper, ElevenLabs, etc.)."""

    @abstractmethod
    def synthesize_stream(
        self,
        text_stream: AsyncIterator[str],
        voice: str | None = None,
    ) -> AsyncIterator[AudioChunk]:
        """Accepts streaming text tokens and yields playable audio chunks."""
        raise NotImplementedError
