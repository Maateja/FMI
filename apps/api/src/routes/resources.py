from fastapi import APIRouter, Depends, Query

from src.core.security import CurrentUser, require_user
from src.schemas.questions import ResourceResponse

router = APIRouter(prefix="/resources", tags=["resources"])

SAMPLE_RESOURCES = [
    {
        "id": "r-01",
        "title": "Mastering the STAR Method for Behavioral Interviews",
        "description": (
            "Complete guide on structuring behavioral answers using "
            "Situation, Task, Action, and Result."
        ),
        "url": "https://www.themuse.com/advice/star-interview-method",
        "resource_type": "article",
        "skill_gap_tag": "star_method",
        "domain": "hr",
    },
    {
        "id": "r-02",
        "title": "Eliminating Filler Words: The Art of the Pause",
        "description": (
            "Practical vocal drills to replace um, uh, and like with confident silent pauses."
        ),
        "url": "https://hbr.org/2018/04/how-to-stop-saying-um-ah-and-you-know",
        "resource_type": "article",
        "skill_gap_tag": "filler_words",
        "domain": "general_communication",
    },
    {
        "id": "r-03",
        "title": "JavaScript Visualized: The Event Loop & Concurrency",
        "description": (
            "Visual deep-dive into the V8 engine, call stack, microtask queue, and event loop."
        ),
        "url": "https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif",
        "resource_type": "article",
        "skill_gap_tag": "event_loop",
        "domain": "frontend",
    },
]


@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    skill_gap: str | None = Query(None),
    domain: str | None = Query(None),
    user: CurrentUser = Depends(require_user),
) -> list[ResourceResponse]:
    results = SAMPLE_RESOURCES
    if skill_gap:
        results = [r for r in results if r["skill_gap_tag"] == skill_gap]
    if domain:
        results = [r for r in results if r["domain"] == domain]
    return [
        ResourceResponse(
            id=str(r["id"]),
            title=str(r["title"]),
            description=str(r["description"]),
            url=str(r["url"]),
            resource_type=str(r["resource_type"]),
            skill_gap_tag=str(r["skill_gap_tag"]),
            domain=str(r["domain"]),
        )
        for r in results
    ]
