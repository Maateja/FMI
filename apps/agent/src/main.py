import asyncio
import sys

from src.agent import VoiceLoopAgent
from src.core.config import agent_settings
from src.core.logging import agent_logger, setup_agent_logging
from src.providers.base import LLMMessage

try:
    from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli  # type: ignore[import-untyped,import-not-found]
    HAS_LIVEKIT_AGENTS = True
except ImportError:
    HAS_LIVEKIT_AGENTS = False


async def entrypoint(ctx: "JobContext") -> None:
    """LiveKit Agents entrypoint invoked when a candidate joins an interview room."""
    agent_logger.info("Connecting agent to room", room=ctx.room.name)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    agent = VoiceLoopAgent()
    agent_logger.info("VoiceLoopAgent initialized for session", room=ctx.room.name)

    # Publish agent audio track and data channel communication
    participant = await ctx.wait_for_participant()
    agent_logger.info("Participant joined interview room", identity=participant.identity)

    # Greet candidate
    agent.set_state("speaking")
    greeting = "Hello! Welcome to your mock interview session. Whenever you're ready, please introduce yourself."
    agent.conversation_history.append(LLMMessage(role="assistant", content=greeting))


async def run_standalone() -> None:
    """Fallback runner when livekit-agents is absent or run in local dev mode."""
    setup_agent_logging()
    agent_logger.info(
        "FMI Voice Loop Agent daemon started",
        livekit_url=agent_settings.LIVEKIT_URL,
        stt_provider=agent_settings.STT_PROVIDER,
        llm_provider=agent_settings.LLM_PROVIDER,
        tts_provider=agent_settings.TTS_PROVIDER,
        has_livekit_sdk=HAS_LIVEKIT_AGENTS,
    )

    agent = VoiceLoopAgent()
    agent_logger.info("VoiceLoopAgent readiness verified", state=agent.state)

    try:
        while True:
            await asyncio.sleep(3600)
    except (asyncio.CancelledError, KeyboardInterrupt):
        agent_logger.info("Agent daemon stopped")


def main() -> None:
    setup_agent_logging()
    if HAS_LIVEKIT_AGENTS and "dev" not in sys.argv:
        cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
    else:
        asyncio.run(run_standalone())


if __name__ == "__main__":
    main()
