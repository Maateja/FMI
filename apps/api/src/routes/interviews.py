import base64
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from src.core.config import settings
from src.core.database import get_supabase_admin_client
from src.core.logging import logger
from src.core.security import CurrentUser, require_user
from src.schemas.interviews import (
    BodyMetricsBatchRequest,
    BodyMetricsBatchResponse,
    InterviewCreateRequest,
    InterviewResponse,
    LiveKitTokenResponse,
)
from src.services.characters import (
    INTERVIEWER_CHARACTERS,
    clean_spoken_text,
    get_character,
    list_characters,
)
from src.services.interview_state import get_or_create_session
from src.services.livekit import generate_livekit_token
from src.services.report_engine import (
    InterviewReportData,
    _dev_reports,
    generate_interview_report,
    render_html_report,
)
from src.services.usage_limits import UsageLimits, get_usage, increment_usage
from src.services.visemes import generate_speech_visemes
from src.services.voice_runner import VoiceRoundTripResponse, run_voice_round_trip

router = APIRouter(prefix="/interviews", tags=["interviews"])

# In-memory dev storage store when running offline/local mock
_dev_interviews: dict[str, dict[str, datetime | int | str | None]] = {}
_dev_body_metrics: dict[str, list[dict[str, Any]]] = {}


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
    # Phase 4 Usage Limits: Check candidate quota before starting
    usage = await get_usage(user.id)
    if not usage.can_start:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=usage.reason
            or "Interview limit reached. Contact support for additional sessions.",
        )

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
    user_sessions = [i for i in _dev_interviews.values() if i["user_id"] == user.id]
    return [_to_interview_response(i) for i in user_sessions]


@router.get("/usage/me", response_model=UsageLimits)
async def get_my_usage_limits(
    user: CurrentUser = Depends(require_user),
) -> UsageLimits:
    """Retrieves current interview quota and remaining sessions for candidate."""
    return await get_usage(user.id)


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
    live_transcript: str | None = None


@router.post(
    "/{interview_id}/turn",
    response_model=VoiceRoundTripResponse,
)
async def submit_interview_turn(
    interview_id: str,
    request: Request,
    user: CurrentUser = Depends(require_user),
) -> VoiceRoundTripResponse:
    """
    Submits a candidate turn (audio or recognized live_transcript text) for
    adaptive follow-up evaluation and conversational state progression.
    Supports both multipart/form-data from web clients and JSON payloads.
    """
    interview = _dev_interviews.get(interview_id)
    target_role = str(interview["target_role"]) if interview else "Frontend Developer"

    raw_audio = b""
    user_transcript: str | None = None

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        audio_file = form.get("audio")
        if audio_file and hasattr(audio_file, "read"):
            raw_audio = await audio_file.read()
        live_text = form.get("live_transcript")
        if isinstance(live_text, str) and live_text.strip():
            user_transcript = live_text.strip()
    else:
        try:
            body = await request.json()
            if "audio_base64" in body and body["audio_base64"]:
                raw_audio = base64.b64decode(body["audio_base64"])
            if "live_transcript" in body and body["live_transcript"]:
                user_transcript = str(body["live_transcript"]).strip()
        except Exception:
            raw_audio = await request.body()

    # Update interview started_at timestamp
    if interview and interview.get("started_at") is None:
        interview["started_at"] = datetime.now(UTC)
        interview["status"] = "in_progress"
        await increment_usage(user.id)

    return await run_voice_round_trip(
        raw_audio,
        target_role=target_role,
        interview_id=interview_id,
        user_id=user.id,
        user_transcript_override=user_transcript,
    )


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

    # Update interview started_at timestamp
    if interview and interview.get("started_at") is None:
        interview["started_at"] = datetime.now(UTC)
        interview["status"] = "in_progress"
        # Increment usage counter on first voice turn
        await increment_usage(user.id)

    return await run_voice_round_trip(
        raw_audio,
        target_role=target_role,
        interview_id=interview_id,
        user_id=user.id,
        user_transcript_override=payload.live_transcript,
    )


@router.get("/{interview_id}/state")
async def get_interview_state(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> dict[str, Any]:
    """Retrieves current interview state machine position and progress."""
    interview = _dev_interviews.get(interview_id)
    target_role = str(interview["target_role"]) if interview else "Frontend Developer"

    session = get_or_create_session(
        interview_id=interview_id,
        user_id=user.id,
        target_role=target_role,
    )

    return {
        "interview_id": interview_id,
        "round": session.status,
        "question_index": session.question_index + 1,
        "total_questions": len(session.questions),
        "current_question": session.current_question.get("question_text", ""),
        "follow_up_count": session.follow_up_count,
        "max_follow_ups": session.max_follow_ups,
        "turns_count": len(session.turns),
        "is_completed": session.status == "completed",
    }


@router.get("/{interview_id}/turns")
async def get_interview_turns(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> list[dict[str, Any]]:
    """Retrieves all persisted turns for this session."""
    interview = _dev_interviews.get(interview_id)
    target_role = str(interview["target_role"]) if interview else "Frontend Developer"

    session = get_or_create_session(
        interview_id=interview_id,
        user_id=user.id,
        target_role=target_role,
    )

    return [turn.model_dump() for turn in session.turns]


@router.post("/{interview_id}/complete")
async def complete_interview(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> dict[str, Any]:
    """Concludes the interview and records end time."""
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    now = datetime.now(UTC)
    interview["ended_at"] = now
    interview["status"] = "completed"

    started = interview.get("started_at")
    if isinstance(started, datetime):
        interview["duration_seconds"] = int((now - started).total_seconds())

    return {
        "status": "completed",
        "interview_id": interview_id,
        "duration_seconds": interview.get("duration_seconds", 0),
    }


@router.post(
    "/{interview_id}/metrics/batch",
    response_model=BodyMetricsBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_body_metrics_batch(
    interview_id: str,
    payload: BodyMetricsBatchRequest,
    user: CurrentUser = Depends(require_user),
) -> BodyMetricsBatchResponse:
    """
    Phase 5: Receives client-side vision metrics (MediaPipe Face & Pose) in 5-second batches.
    Zero raw camera pixels leave the browser; only privacy-preserving numerical scores are saved.
    """
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    # In-memory storage for offline / dev
    if interview_id not in _dev_body_metrics:
        _dev_body_metrics[interview_id] = []

    for item in payload.metrics:
        _dev_body_metrics[interview_id].append(item.model_dump())

    # Attempt Supabase database persistence if configured
    try:
        client = get_supabase_admin_client()
        db_rows = [
            {
                "id": str(uuid.uuid4()),
                "interview_id": interview_id,
                "timestamp_offset_seconds": item.timestamp_offset_seconds,
                "eye_contact_score": item.eye_contact_score,
                "head_pose_stability": item.head_pose_stability,
                "posture_score": item.posture_score,
                "expressiveness_score": item.expressiveness_score,
                "created_at": datetime.now(UTC).isoformat(),
            }
            for item in payload.metrics
        ]
        client.table("body_metrics").insert(db_rows).execute()
    except Exception as exc:
        logger.info(f"Using in-memory store for body metrics (DB unavailable): {exc}")

    latest = payload.metrics[-1] if payload.metrics else None
    return BodyMetricsBatchResponse(
        interview_id=interview_id,
        inserted_count=len(payload.metrics),
        latest_snapshot=latest,
    )


@router.get("/{interview_id}/metrics")
async def get_interview_metrics(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> dict[str, Any]:
    """Retrieves body language vision metric series and aggregate averages."""
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    items = _dev_body_metrics.get(interview_id, [])

    # Calculate summary aggregations
    if items:
        n = len(items)
        avg_eye = sum(i["eye_contact_score"] for i in items) / n
        avg_posture = sum(i["posture_score"] for i in items) / n
        avg_stability = sum(i["head_pose_stability"] for i in items) / n
        avg_expressiveness = sum(i["expressiveness_score"] for i in items) / n
    else:
        avg_eye = 0.85
        avg_posture = 0.80
        avg_stability = 0.90
        avg_expressiveness = 0.75

    return {
        "interview_id": interview_id,
        "count": len(items),
        "metrics": items,
        "summary": {
            "avg_eye_contact": round(avg_eye, 3),
            "avg_posture": round(avg_posture, 3),
            "head_pose_stability": round(avg_stability, 3),
            "expressiveness": round(avg_expressiveness, 3),
        },
    }


@router.post(
    "/{interview_id}/report/generate",
    response_model=InterviewReportData,
    status_code=status.HTTP_201_CREATED,
)
async def create_interview_report(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> InterviewReportData:
    """
    Phase 6: Generates full structured evaluation report from turns, speech analytics,
    and client vision metrics.
    """
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    target_role = str(interview.get("target_role") or "Frontend Developer")

    # Gather turns from active session
    session = get_or_create_session(
        interview_id=interview_id,
        user_id=user.id,
        target_role=target_role,
    )
    turns_data = [t.model_dump() for t in session.turns]
    vision_metrics = _dev_body_metrics.get(interview_id, [])

    return await generate_interview_report(
        interview_id=interview_id,
        user_id=user.id,
        target_role=target_role,
        turns=turns_data,
        vision_metrics=vision_metrics,
    )


@router.get("/{interview_id}/report", response_model=InterviewReportData)
async def get_interview_report(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> InterviewReportData:
    """Fetches previously generated evaluation report."""
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    report = _dev_reports.get(interview_id)
    if not report:
        # Auto-generate if not yet triggered
        target_role = str(interview.get("target_role") or "Frontend Developer")
        session = get_or_create_session(
            interview_id=interview_id,
            user_id=user.id,
            target_role=target_role,
        )
        report = await generate_interview_report(
            interview_id=interview_id,
            user_id=user.id,
            target_role=target_role,
            turns=[t.model_dump() for t in session.turns],
            vision_metrics=_dev_body_metrics.get(interview_id, []),
        )

    return report


@router.get("/{interview_id}/report/html", response_class=HTMLResponse)
async def get_interview_report_html(
    interview_id: str,
    user: CurrentUser = Depends(require_user),
) -> HTMLResponse:
    """Renders standalone printable HTML document for saving or browser printing to PDF."""
    interview = _dev_interviews.get(interview_id)
    if not interview or interview["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    target_role = str(interview.get("target_role") or "Frontend Developer")
    report = await get_interview_report(interview_id, user)
    html_content = render_html_report(report, target_role=target_role)
    return HTMLResponse(content=html_content, status_code=200)


class NextTurnRequest(BaseModel):
    interview_id: str
    character_id: str = "priya"
    user_transcript: str = ""
    audio_base64: str | None = None


class NextTurnResponse(BaseModel):
    interview_id: str
    character_id: str
    character_name: str
    spoken_reply: str
    question: str
    audio_base64: str
    audio_mime_type: str = "audio/wav"
    visemes: list[dict[str, Any]] = []
    internal_score: int
    round: str
    is_completed: bool
    is_follow_up: bool
    follow_up_count: int
    latency_ms: float


@router.get("/characters", response_model=list[dict[str, Any]])
async def get_characters() -> list[dict[str, Any]]:
    """Lists the 5 3D interviewer characters (Arjun, Rohan, Priya, Ananya, Kavita)."""
    return list_characters()


@router.post("/next-turn", response_model=NextTurnResponse)
async def process_next_turn(
    payload: NextTurnRequest,
    user: CurrentUser = Depends(require_user),
) -> NextTurnResponse:
    """
    Step 2 Conversational API endpoint:
    - Persona & speech-formatting wrapper (short spoken sentences, stripped markdown/emojis).
    - Map each interviewer character to specific system prompt and Kokoro/Edge voice ID.
    - Generates 3D viseme timing data for lip-sync animation.
    - Returns structured JSON for TalkingHead / Three.js 3D avatar.
    """
    import time
    t_start = time.perf_counter()
    character = get_character(payload.character_id)
    interview = _dev_interviews.get(payload.interview_id)
    target_role = str(interview["target_role"]) if interview else "Frontend Developer"

    raw_audio = b""
    if payload.audio_base64:
        try:
            raw_audio = base64.b64decode(payload.audio_base64)
        except Exception:
            raw_audio = b""

    # Execute round trip with adaptive probing
    round_trip = await run_voice_round_trip(
        raw_audio,
        target_role=target_role,
        interview_id=payload.interview_id,
        user_id=user.id,
        user_transcript_override=payload.user_transcript,
    )

    # Clean spoken text for TTS and avatar speech
    clean_speech = clean_spoken_text(round_trip.ai_response)
    visemes = generate_speech_visemes(clean_speech, duration_seconds=2.8)
    elapsed_ms = (time.perf_counter() - t_start) * 1000

    return NextTurnResponse(
        interview_id=payload.interview_id,
        character_id=character.id,
        character_name=character.name,
        spoken_reply=clean_speech,
        question=clean_speech,
        audio_base64=round_trip.audio_base64,
        audio_mime_type=round_trip.audio_mime_type,
        visemes=visemes,
        internal_score=round_trip.quality_score,
        round=round_trip.round,
        is_completed=round_trip.is_completed,
        is_follow_up=round_trip.is_follow_up,
        follow_up_count=round_trip.follow_up_count,
        latency_ms=round(elapsed_ms, 2),
    )
