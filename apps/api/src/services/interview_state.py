import json
import uuid
from datetime import UTC, datetime
from typing import Any

import httpx
from pydantic import BaseModel

from src.core.config import settings
from src.core.database import get_supabase_admin_client
from src.core.logging import logger
from src.routes.questions import SAMPLE_QUESTIONS


class TurnRecord(BaseModel):
    id: str
    interview_id: str
    question_id: str | None = None
    turn_number: int
    round: str
    interviewer_question: str
    user_transcript: str
    duration_seconds: float = 0.0
    turn_metrics: dict[str, Any] = {}
    created_at: datetime


class InterviewSessionState:
    """
    Manages the live state machine for an active interview session.
    Controls rounds (warmup -> hr -> technical -> closing -> completed),
    adaptive follow-up probing (max 2 per question), and turn history.
    """

    def __init__(
        self,
        interview_id: str,
        user_id: str,
        target_role: str = "Frontend Developer",
        difficulty: str = "fresher",
    ) -> None:
        self.interview_id = interview_id
        self.user_id = user_id
        self.target_role = target_role
        self.difficulty = difficulty

        self.status: str = "warmup"  # warmup | hr | technical | closing | completed
        self.question_index: int = 0
        self.follow_up_count: int = 0
        self.max_follow_ups: int = 2
        self.turns: list[TurnRecord] = []
        self.started_at: datetime = datetime.now(UTC)
        self.ended_at: datetime | None = None

        # Build personalized question track
        self.questions: list[dict[str, Any]] = self._build_question_track(target_role)
        self.current_question: dict[str, Any] = self.questions[0] if self.questions else {}

    def _build_question_track(self, role: str) -> list[dict[str, Any]]:
        """Constructs an interview question sequence."""
        track: list[dict[str, Any]] = []

        # 1. Warmup / Intro question
        track.append({
            "id": "q-warmup-01",
            "round": "warmup",
            "category": "Introduction",
            "question_text": (
                "Welcome to your interview! To start off, please introduce yourself "
                "and share what motivated you to pursue a career in technology."
            ),
            "expected_key_points": ["Background", "Education", "Key Projects", "Motivation"],
        })

        # 2. HR / Behavioral question
        track.append({
            "id": "q-hr-01",
            "round": "hr",
            "category": "Behavioral",
            "question_text": (
                "Can you tell me about a time you faced a difficult technical bug or "
                "tight deadline during a project, and how you worked through it?"
            ),
            "expected_key_points": ["Situation", "Action", "Debugging strategy", "Outcome"],
        })

        # 3. Technical Core Questions (filtered by role)
        domain = "frontend"
        if "backend" in role.lower():
            domain = "backend"
        elif "data" in role.lower() or "ml" in role.lower():
            domain = "data_ml"

        tech_qs = [q for q in SAMPLE_QUESTIONS if q["domain"] == domain]
        if not tech_qs:
            tech_qs = SAMPLE_QUESTIONS

        for q in tech_qs[:2]:
            track.append({
                "id": str(q["id"]),
                "round": "technical",
                "category": str(q["category"]),
                "question_text": str(q["question_text"]),
                "expected_key_points": list(q["expected_key_points"]),
            })

        # 4. Closing question
        track.append({
            "id": "q-closing-01",
            "round": "closing",
            "category": "Closing",
            "question_text": (
                "Thank you for sharing your experience. We are wrapping up our technical rounds. "
                "Do you have any questions for me about the role or the engineering culture?"
            ),
            "expected_key_points": ["Inquisitive", "Culture interest", "Thoughtful wrap up"],
        })

        return track

    async def evaluate_and_advance(
        self,
        user_transcript: str,
        speech_metrics: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Processes candidate response:
        1. Evaluates completeness and depth via Gemini.
        2. Decides whether to ask an adaptive follow-up or advance to next question.
        3. Persists the turn.
        """
        current_q = self.current_question
        turn_num = len(self.turns) + 1

        # 1. Evaluate candidate response
        analysis = await self._analyze_response(
            question=current_q.get("question_text", ""),
            expected_points=current_q.get("expected_key_points", []),
            answer=user_transcript,
        )

        should_probe = (
            self.status == "technical"
            and not analysis.get("is_complete", False)
            and self.follow_up_count < self.max_follow_ups
            and bool(analysis.get("follow_up_question"))
        )

        if should_probe:
            self.follow_up_count += 1
            ai_next_speech = str(analysis["follow_up_question"])
            is_follow_up = True
        else:
            # Advance to next question
            self.follow_up_count = 0
            self.question_index += 1

            if self.question_index < len(self.questions):
                self.current_question = self.questions[self.question_index]
                self.status = self.current_question.get("round", "technical")
                ai_next_speech = self.current_question.get("question_text", "")
            else:
                self.status = "completed"
                self.ended_at = datetime.now(UTC)
                ai_next_speech = (
                    "That concludes our interview session today! You did a great job working "
                    "through the questions. Your detailed evaluation report is now being generated."
                )
            is_follow_up = False

        # 2. Persist turn record
        turn_record = TurnRecord(
            id=str(uuid.uuid4()),
            interview_id=self.interview_id,
            question_id=current_q.get("id"),
            turn_number=turn_num,
            round=current_q.get("round", "technical"),
            interviewer_question=current_q.get("question_text", ""),
            user_transcript=user_transcript,
            duration_seconds=round(speech_metrics.get("duration_seconds", 0.0), 2),
            turn_metrics={
                **speech_metrics,
                "quality_score": analysis.get("quality_score", 70),
                "is_follow_up": is_follow_up,
                "follow_up_count": self.follow_up_count,
            },
            created_at=datetime.now(UTC),
        )
        self.turns.append(turn_record)

        # Attempt DB persistence
        await self._persist_turn_to_db(turn_record)

        return {
            "ai_next_speech": ai_next_speech,
            "round": self.status,
            "question_index": self.question_index + 1,
            "total_questions": len(self.questions),
            "is_follow_up": is_follow_up,
            "follow_up_count": self.follow_up_count,
            "max_follow_ups": self.max_follow_ups,
            "quality_score": analysis.get("quality_score", 75),
            "is_completed": self.status == "completed",
            "turn_number": turn_num,
        }

    async def _analyze_response(
        self,
        question: str,
        expected_points: list[str],
        answer: str,
    ) -> dict[str, Any]:
        """Uses Gemini 2.0 Flash to evaluate answer depth and generate adaptive follow-up."""
        api_key = settings.__dict__.get("GEMINI_API_KEY", "")
        if not api_key or api_key.startswith("placeholder") or len(answer.strip()) < 10:
            # Deterministic local fallback
            is_short = len(answer.split()) < 15
            return {
                "is_complete": not is_short,
                "quality_score": 65 if is_short else 85,
                "follow_up_question": (
                    "Could you elaborate more specifically on how you handled that in practice?"
                    if is_short
                    else None
                ),
            }

        prompt = (
            f"You are an expert AI technical interviewer assessing a college fresher candidate.\n"
            f"Question asked: \"{question}\"\n"
            f"Expected key points: {', '.join(expected_points)}\n"
            f"Candidate spoken response: \"{answer}\"\n\n"
            "Provide a concise JSON response with:\n"
            "- is_complete (boolean: true if candidate addressed core concepts satisfactorily)\n"
            "- quality_score (integer: 0 to 100)\n"
            "- follow_up_question (string or null: If is_complete is false, "
            "write ONE concise follow-up sentence probing the missing detail. If complete, null.)\n"
            "Respond with ONLY valid JSON."
        )

        try:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash"
                f":generateContent?key={api_key}"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    if isinstance(parsed, dict):
                        return parsed
        except Exception as exc:
            logger.warning(f"Error in Gemini adaptive analysis: {exc}")

        return {
            "is_complete": len(answer.split()) >= 20,
            "quality_score": 75,
            "follow_up_question": "Can you provide a concrete example of that from your projects?",
        }

    async def _persist_turn_to_db(self, turn: TurnRecord) -> None:
        """Saves turn into Supabase interview_turns table with silent fallback."""
        try:
            client = get_supabase_admin_client()
            client.table("interview_turns").insert({
                "id": turn.id,
                "interview_id": turn.interview_id,
                "question_id": turn.question_id,
                "turn_number": turn.turn_number,
                "round": turn.round,
                "interviewer_question": turn.interviewer_question,
                "user_transcript": turn.user_transcript,
                "duration_seconds": turn.duration_seconds,
                "turn_metrics": turn.turn_metrics,
            }).execute()
        except Exception as e:
            logger.info(f"Using local memory for turn persistence (DB cache loading): {e}")


# Global registry of active interview session state machines
_active_sessions: dict[str, InterviewSessionState] = {}


def get_or_create_session(
    interview_id: str,
    user_id: str,
    target_role: str = "Frontend Developer",
    difficulty: str = "fresher",
) -> InterviewSessionState:
    if interview_id not in _active_sessions:
        _active_sessions[interview_id] = InterviewSessionState(
            interview_id=interview_id,
            user_id=user_id,
            target_role=target_role,
            difficulty=difficulty,
        )
    return _active_sessions[interview_id]
