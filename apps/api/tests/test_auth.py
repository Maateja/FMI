import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.core.config import settings
from src.core.security import CurrentUser, decode_supabase_jwt, get_current_user, require_admin
from src.routes.auth import get_me


def create_test_jwt(
    user_id: str = "user-123", email: str = "test@example.com", role: str = "user"
) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "user_metadata": {
            "full_name": "Test Candidate",
            "target_role": "Frontend Developer",
            "role": role,
        },
        "app_metadata": {
            "role": role,
        },
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def test_decode_jwt_success():
    token = create_test_jwt("candidate-101", "cand@test.com", "user")
    payload = decode_supabase_jwt(token)
    assert payload["sub"] == "candidate-101"
    assert payload["email"] == "cand@test.com"


@pytest.mark.asyncio
async def test_get_current_user_success():
    token = create_test_jwt("candidate-101", "cand@test.com", "user")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = await get_current_user(creds)
    assert user.id == "candidate-101"
    assert user.email == "cand@test.com"
    assert user.full_name == "Test Candidate"
    assert user.role == "user"


@pytest.mark.asyncio
async def test_get_current_user_no_credentials():
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(None)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_admin():
    normal_user = CurrentUser(id="1", email="user@test.com", role="user")
    admin_user = CurrentUser(id="2", email="admin@test.com", role="admin")

    with pytest.raises(HTTPException) as exc_info:
        await require_admin(normal_user)
    assert exc_info.value.status_code == 403

    verified_admin = await require_admin(admin_user)
    assert verified_admin.role == "admin"


@pytest.mark.asyncio
async def test_auth_me_route():
    user = CurrentUser(
        id="user-xyz",
        email="xyz@test.com",
        role="user",
        full_name="Alex Tech",
        metadata={"target_role": "Backend Developer", "target_experience_level": "Fresher"},
    )
    res = await get_me(user)
    assert res.id == "user-xyz"
    assert res.email == "xyz@test.com"
    assert res.full_name == "Alex Tech"
    assert res.target_role == "Backend Developer"
