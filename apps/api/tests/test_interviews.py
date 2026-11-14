import pytest

from src.core.security import CurrentUser
from src.routes.interviews import create_interview, get_room_token, list_interviews
from src.schemas.interviews import InterviewCreateRequest
from src.services.livekit import generate_livekit_token


@pytest.mark.asyncio
async def test_create_and_list_interview_flow():
    user = CurrentUser(
        id="user-candidate-99",
        email="cand99@college.edu",
        role="user",
        full_name="Fresh Candidate",
    )

    req = InterviewCreateRequest(target_role="Full Stack Developer", difficulty="fresher")
    created = await create_interview(req, user=user)

    assert created.user_id == user.id
    assert created.target_role == "Full Stack Developer"
    assert created.status == "setup"
    assert created.livekit_room_name.startswith("fmi-room-")

    # List interviews
    interviews = await list_interviews(user=user)
    assert len(interviews) >= 1
    assert any(i.id == created.id for i in interviews)

    # Mint room token
    token_response = await get_room_token(created.id, user=user)
    assert token_response.room_name == created.livekit_room_name
    assert token_response.participant_name == "Fresh Candidate"
    assert len(token_response.token) > 20


def test_generate_livekit_token():
    token = generate_livekit_token(
        room_name="room-alpha",
        participant_identity="user-alpha",
        participant_name="Alpha Tester",
    )
    assert isinstance(token, str)
    assert len(token) > 20
