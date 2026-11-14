from typing import Any

from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    role: str = "user"
    full_name: str | None = None
    avatar_url: str | None = None
    target_role: str = "Full Stack Developer"
    target_experience_level: str = "Fresher"
    metadata: dict[str, Any] = {}
