from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class InterviewCreateRequest(BaseModel):
    template_id: str | None = None
    target_role: str = Field(default="Frontend Developer", min_length=2, max_length=100)
    difficulty: str = Field(default="fresher", pattern="^(fresher|junior|intermediate|senior)$")


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    template_id: str | None = None
    target_role: str
    difficulty: str
    status: str
    livekit_room_name: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_seconds: int = 0
    created_at: datetime


class LiveKitTokenResponse(BaseModel):
    token: str
    server_url: str
    room_name: str
    participant_name: str


class TurnCreateRequest(BaseModel):
    turn_number: int
    round: str = Field(pattern="^(warmup|hr|technical|closing)$")
    interviewer_question: str
    user_transcript: str | None = None
    word_timestamps: list[dict[str, Any]] = []
    duration_seconds: float = 0.0
    turn_metrics: dict[str, Any] = {}


class BodyMetricItem(BaseModel):
    timestamp_offset_seconds: float = Field(ge=0.0)
    eye_contact_score: float = Field(ge=0.0, le=1.0)
    head_pose_stability: float = Field(ge=0.0, le=1.0)
    posture_score: float = Field(ge=0.0, le=1.0)
    expressiveness_score: float = Field(ge=0.0, le=1.0)


class BodyMetricsBatchRequest(BaseModel):
    metrics: list[BodyMetricItem] = Field(min_length=1, max_length=100)


class BodyMetricsBatchResponse(BaseModel):
    interview_id: str
    inserted_count: int
    latest_snapshot: BodyMetricItem | None = None
