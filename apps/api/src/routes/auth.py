from fastapi import APIRouter, Depends

from src.core.security import CurrentUser, require_user
from src.schemas.auth import UserProfileResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserProfileResponse)
async def get_me(user: CurrentUser = Depends(require_user)) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        target_role=user.metadata.get("target_role", "Full Stack Developer"),
        target_experience_level=user.metadata.get("target_experience_level", "Fresher"),
        metadata=user.metadata,
    )
