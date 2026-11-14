from fastapi import APIRouter

from src.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "fmi-api",
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    return {
        "status": "ready",
        "service": "fmi-api",
    }
