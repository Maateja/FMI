import base64
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.core.config import settings
from src.core.security import CurrentUser, require_user
from src.schemas.interviews import (
    InterviewCreateRequest,
    InterviewResponse,
    LiveKitTokenResponse,
)
from src.services.livekit import generate_livekit_token
from src.services.voice_runner import VoiceRoundTripResponse, run_voice_round_trip

router = APIRouter(prefix="/interviews", tags=["interviews"])

# In-memory dev storage store when running offline/local mock
_dev_interviews: dict[str, dict[str, datetime | int | str | None]] = {}


def _to_interview_response(data: dict[str, datetime | int | str | None]) -> InterviewResponse:
    created = data["created_at"]
    started = data.get("started_at")
    ended = data.get("ended_at")
    raw_dur = data.get("duration_seconds")

    assert isinstance(created, datetime)
    assert started is None or isinstance(started, datetime)
    assert ended is None or isinstance(ended, datetime)
    dur_val = int(raw_dur) if isinstance(raw_dur, (int, str)) else 0

    return InterviewResponse(
        id=str(data["id"]),
        user_id=str(data["user_id"]),
        template_id=str(data["template_id"]) if data.get("template_id") else None,
        target_role=str(data["target_role"]),
        difficulty=str(data["difficulty"]),
        status=str(data["status"]),
        livekit_room_name=str(data["livekit_room_name"]),
        started_at=started,
        ended_at=ended,
        duration_seconds=dur_val,
        created_at=created,
    )


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreateRequest,
    user: CurrentUser = Depends(require_user),
) -> InterviewResponse:
    interview_id = str(uuid.uuid4())
    room_name = f"fmi-room-{interview_id[:8]}"
    now = datetime.now(UTC)

    interview_record: dict[str, datetime | int | str | None] = {
        "id": interview_id,
        "user_id": user.id,
        "template_id": payload.template_id,
        "target_role": payload.target_role,
        "difficulty": payload.difficulty,
        "status": "setup",
        "livekit_room_name": room_name,
        "started_at": None,
        "ended_at": None,
        "duration_seconds": 0,
        "created_at": now,
    }

    _dev_interviews[interview_id] = interview_record
    return _to_interview_response(interview_record)


@router.get("", response_model=list[InterviewResponse])
async def list_interviews(
    user: CurrentUser = Depends(require_user),
) -> list[InterviewResponse]:
    user_interviews = [
        item for item in _dev_interviews.values() if item["user_id"] == user.id
    ]
    return [_to_interview_response(item) for item in user_interviews]


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> InterviewResponse:
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )
    return _to_interview_response(interview)


@router.post("/{interview_id}/token", response_model=LiveKitTokenResponse)
async def get_room_token(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> LiveKitTokenResponse:
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    room_name = str(interview["livekit_room_name"])
    participant_name = user.full_name or user.email.split("@")[0]
    token = generate_livekit_token(
        room_name=room_name,
        participant_identity=user.id,
        participant_name=participant_name,
    )

    return LiveKitTokenResponse(
        token=token,
        server_url=settings.LIVEKIT_URL,
        room_name=room_name,
        participant_name=participant_name,
    )


class VoiceRoundTripPayload(BaseModel):
    audio_base64: str = ""


@router.post(
    "/{interview_id}/voice-loop/round-trip",
    response_model=VoiceRoundTripResponse,
)
async def execute_voice_round_trip(
    interview_id: str,
    payload: VoiceRoundTripPayload,
    user: CurrentUser = Depends(require_user),
) -> VoiceRoundTripResponse:
    interview = _dev_interviews.get(interview_id)
    target_role = str(interview["target_role"]) if interview else "Frontend Developer"

    raw_audio = b""
    if payload.audio_base64:
        try:
            raw_audio = base64.b64decode(payload.audio_base64)
        except Exception:
            raw_audio = b""

    return await run_voice_round_trip(raw_audio, target_role=target_role)
