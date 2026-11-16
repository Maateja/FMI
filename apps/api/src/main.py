from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.logging import logger, setup_logging
from src.core.security_middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from src.routes import auth, health, interviews, questions, resources


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging(settings.ENVIRONMENT)
    logger.info("Starting FMI FastAPI service", env=settings.ENVIRONMENT, port=settings.PORT)
    yield
    logger.info("Shutting down FMI FastAPI service")


app = FastAPI(
    title="Freshers Mock Interview (FMI) API",
    description="High-performance async backend for FMI AI voice interview platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 7 Hardening: Defensive Security Headers & Rate Limiting
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests_per_minute=200)

# Mount routes
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(interviews.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(resources.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host=settings.HOST, port=settings.PORT, reload=True)
