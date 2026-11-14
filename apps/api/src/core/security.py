from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from src.core.config import settings
from src.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str
    role: str = "user"
    full_name: str | None = None
    avatar_url: str | None = None
    metadata: dict[str, Any] = {}


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Decodes and verifies a Supabase JWT.
    In development, if the secret doesn't match standard HS256, provides safe fallbacks.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.InvalidSignatureError as err:
        if settings.ENVIRONMENT == "development":
            logger.warning("JWT signature failed, falling back to unverified decode in dev")
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except jwt.ExpiredSignatureError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication token verification error: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims (missing sub or email)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_meta = payload.get("user_metadata", {})
    app_meta = payload.get("app_metadata", {})
    role = app_meta.get("role") or user_meta.get("role") or "user"

    return CurrentUser(
        id=user_id,
        email=email,
        role=role,
        full_name=user_meta.get("full_name") or user_meta.get("name"),
        avatar_url=user_meta.get("avatar_url"),
        metadata=user_meta,
    )


async def require_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user


async def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required for this operation",
        )
    return current_user
