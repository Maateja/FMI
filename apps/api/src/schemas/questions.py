
from pydantic import BaseModel


class QuestionBankResponse(BaseModel):
    id: str
    domain: str
    difficulty: str
    category: str
    question_text: str
    expected_key_points: list[str]
    probing_follow_ups: list[str]
    model_answer: str | None = None


class ResourceResponse(BaseModel):
    id: str
    title: str
    description: str
    url: str
    resource_type: str
    skill_gap_tag: str
    domain: str
