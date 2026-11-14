import time
from collections.abc import AsyncIterator
from typing import Any

from src.core.logging import agent_logger
from src.providers.base import LLMMessage, LLMProvider, STTProvider, TTSProvider
from src.providers.factory import get_llm_provider, get_stt_provider, get_tts_provider


class VoiceLoopAgent:
    """
    Core Voice Loop Agent.
    Orchestrates VAD interruption, STT, LLM Interviewer Brain, and TTS playback
    with full latency tracking for round-trip benchmarks.
    """

    def __init__(
        self,
        stt: STTProvider | None = None,
        llm: LLMProvider | None = None,
        tts: TTSProvider | None = None,
    ) -> None:
        self.stt = stt or get_stt_provider()
        self.llm = llm or get_llm_provider()
        self.tts = tts or get_tts_provider()

        self.state: str = "idle"  # idle | speaking | listening | thinking
        self.is_interrupted: bool = False
        self.conversation_history: list[LLMMessage] = [
            LLMMessage(
                role="system",
                content=(
                    "You are a professional, warm AI technical interviewer for college freshers. "
                    "Speak in 1 to 2 clear, concise sentences. Ask ONE question at a time. "
                    "Never reveal scoring or recite answers during the interview."
                ),
            )
        ]

    def set_state(self, new_state: str) -> None:
        self.state = new_state
        agent_logger.info("Orb state changed", state=new_state)

    def handle_user_interruption(self) -> None:
        """
        Triggered when VAD detects candidate voice while interviewer is speaking.
        Aborts TTS and flips state to listening.
        """
        if self.state == "speaking":
            agent_logger.info("Interruption detected! Aborting interviewer speech.")
            self.is_interrupted = True
            self.set_state("listening")

    async def run_round_trip(
        self, user_audio_bytes: bytes
    ) -> dict[str, Any]:
        """
        Executes a full voice round-trip:
        User Speech End -> STT -> LLM response -> TTS -> First Audio Output.
        Returns measured latencies for verification.
        """
        t_start = time.perf_counter()
        self.is_interrupted = False

        # 1. State -> Thinking
        self.set_state("thinking")

        # 2. Transcribe Audio (STT)
        t_stt_start = time.perf_counter()
        transcript_chunk = await self.stt.transcribe_file(user_audio_bytes)
        t_stt_end = time.perf_counter()
        stt_latency_ms = (t_stt_end - t_stt_start) * 1000

        user_text = transcript_chunk.text
        agent_logger.info("User speech recognized", transcript=user_text, stt_ms=round(stt_latency_ms, 2))

        self.conversation_history.append(LLMMessage(role="user", content=user_text))

        # 3. LLM Interviewer Brain
        t_llm_start = time.perf_counter()
        ai_response = await self.llm.generate_response(self.conversation_history)
        t_llm_end = time.perf_counter()
        llm_latency_ms = (t_llm_end - t_llm_start) * 1000

        agent_logger.info("AI interviewer response generated", response=ai_response, llm_ms=round(llm_latency_ms, 2))
        self.conversation_history.append(LLMMessage(role="assistant", content=ai_response))

        # 4. State -> Speaking & Synthesize Speech (TTS)
        self.set_state("speaking")

        first_audio_latency_ms: float | None = None
        total_audio_bytes = 0

        async def text_iterator() -> AsyncIterator[str]:
            for token in ai_response.split(" "):
                yield token + " "

        audio_stream = self.tts.synthesize_stream(text_iterator())
        async for audio_chunk in audio_stream:
            # Check for user interruption during synthesis
            if self.is_interrupted:
                agent_logger.info("Halting TTS stream due to user interruption")
                break

            if first_audio_latency_ms is None and len(audio_chunk.data) > 0:
                first_audio_latency_ms = (time.perf_counter() - t_start) * 1000

            total_audio_bytes += len(audio_chunk.data)

        if not self.is_interrupted:
            self.set_state("listening")

        t_total_ms = (time.perf_counter() - t_start) * 1000

        metrics = {
            "user_transcript": user_text,
            "ai_response": ai_response,
            "stt_latency_ms": round(stt_latency_ms, 2),
            "llm_latency_ms": round(llm_latency_ms, 2),
            "time_to_first_audio_ms": round(first_audio_latency_ms or t_total_ms, 2),
            "total_round_trip_ms": round(t_total_ms, 2),
            "audio_bytes_produced": total_audio_bytes,
            "was_interrupted": self.is_interrupted,
        }

        agent_logger.info("Voice round trip completed", **metrics)
        return metrics
