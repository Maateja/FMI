import pytest

from src.services.interview_state import InterviewSessionState, get_or_create_session


@pytest.mark.asyncio
async def test_interview_session_progression():
    session = InterviewSessionState(
        interview_id="session-test-01",
        user_id="user-123",
        target_role="Frontend Developer",
    )

    assert session.status == "warmup"
    assert len(session.questions) >= 4
    assert session.follow_up_count == 0

    # Turn 1: Warmup Answer
    res1 = await session.evaluate_and_advance(
        user_transcript=(
            "Hello, my name is Alex. I am a computer science"
            " graduate who loves building web apps."
        ),
        speech_metrics={"duration_seconds": 3.5},
    )

    assert res1["turn_number"] == 1
    assert len(session.turns) == 1
    assert session.status in ("hr", "technical")

    # Turn 2: Behavioral / HR Answer
    res2 = await session.evaluate_and_advance(
        user_transcript=(
            "During my final year project, our database crashed"
            " and I helped migrate our schema to PostgreSQL."
        ),
        speech_metrics={"duration_seconds": 4.0},
    )

    assert res2["turn_number"] == 2
    assert len(session.turns) == 2


@pytest.mark.asyncio
async def test_adaptive_probe_follow_up_cap():
    session = InterviewSessionState(
        interview_id="session-test-02",
        user_id="user-456",
        target_role="Backend Developer",
    )
    session.status = "technical"

    # Answer 1: Short answer triggering probe 1
    await session.evaluate_and_advance(
        user_transcript="REST is an API format with GET and POST.",
        speech_metrics={"duration_seconds": 1.2},
    )
    assert session.follow_up_count <= session.max_follow_ups

    # Answer 2: Another short answer triggering probe 2
    await session.evaluate_and_advance(
        user_transcript="GET gets data and POST posts data.",
        speech_metrics={"duration_seconds": 1.5},
    )
    assert session.follow_up_count <= session.max_follow_ups

    # Answer 3: Should cap at max 2 and advance to next question
    res3 = await session.evaluate_and_advance(
        user_transcript="Idempotency means calling an API multiple times produces the same result.",
        speech_metrics={"duration_seconds": 2.0},
    )
    # After max follow ups, follow_up_count resets for the next question
    assert res3["follow_up_count"] <= 2


def test_session_registry():
    s1 = get_or_create_session("sess-reg-01", "usr-1", "Frontend Developer")
    s2 = get_or_create_session("sess-reg-01", "usr-1", "Frontend Developer")
    assert s1 is s2
