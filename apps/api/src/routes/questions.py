from fastapi import APIRouter, Depends, Query

from src.core.security import CurrentUser, require_user
from src.schemas.questions import QuestionBankResponse

router = APIRouter(prefix="/questions", tags=["questions"])

SAMPLE_QUESTIONS = [
    {
        "id": "q-fe-01",
        "domain": "frontend",
        "difficulty": "fresher",
        "category": "JavaScript Core",
        "question_text": (
            "Explain the JavaScript Event Loop. How do the call stack, "
            "microtask queue, and macrotask queue interact?"
        ),
        "expected_key_points": [
            "Single-threaded execution",
            "Call stack order",
            "Microtask queue priority (Promises)",
            "Macrotask queue processing (setTimeout)",
        ],
        "probing_follow_ups": [
            "What runs first: setTimeout with 0ms or a resolved Promise.then?",
        ],
        "model_answer": "JavaScript runs synchronous code on the call stack...",
    },
    {
        "id": "q-be-01",
        "domain": "backend",
        "difficulty": "fresher",
        "category": "API Design",
        "question_text": (
            "What makes an API RESTful, and what are the key differences "
            "between GET, POST, PUT, and PATCH methods?"
        ),
        "expected_key_points": [
            "Statelessness",
            "GET is idempotent",
            "POST creates resources",
            "PUT replaces, PATCH modifies",
        ],
        "probing_follow_ups": [
            "What does idempotency mean in HTTP?",
        ],
        "model_answer": "REST relies on standard HTTP verbs and resource URIs...",
    },
    {
        "id": "q-hr-01",
        "domain": "hr",
        "difficulty": "fresher",
        "category": "Introduction",
        "question_text": (
            "Tell me about yourself and what inspired you to pursue a "
            "career in software engineering."
        ),
        "expected_key_points": [
            "Academic background",
            "Turning point or project",
            "Passion and continuous learning",
        ],
        "probing_follow_ups": [
            "What was the most challenging technical project you built?",
        ],
        "model_answer": "A strong answer follows the Present-Past-Future format...",
    },
]


@router.get("", response_model=list[QuestionBankResponse])
async def list_questions(
    domain: str | None = Query(None),
    difficulty: str | None = Query(None),
    user: CurrentUser = Depends(require_user),
) -> list[QuestionBankResponse]:
    results = SAMPLE_QUESTIONS
    if domain:
        results = [q for q in results if q["domain"] == domain]
    if difficulty:
        results = [q for q in results if q["difficulty"] == difficulty]

    return [
        QuestionBankResponse(
            id=str(q["id"]),
            domain=str(q["domain"]),
            difficulty=str(q["difficulty"]),
            category=str(q["category"]),
            question_text=str(q["question_text"]),
            expected_key_points=list(q["expected_key_points"]),
            probing_follow_ups=list(q["probing_follow_ups"]),
            model_answer=str(q["model_answer"]) if q.get("model_answer") else None,
        )
        for q in results
    ]
