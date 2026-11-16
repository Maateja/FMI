"""
Phase 7: Security Middleware & Rate Limiting

Applies production hardening:
1. Essential OWASP security headers (no-sniff, frame denial, strict referrer).
2. In-memory sliding window rate limiter per client IP.
"""

import time
from collections import defaultdict
from collections.abc import Callable
from typing import Any

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects defensive HTTP security headers into every response."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        raw_res = await call_next(request)
        response: Response = raw_res
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self)"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter.
    Limits requests per client IP within a 60-second window.
    """

    def __init__(self, app: ASGIApp, max_requests_per_minute: int = 150) -> None:
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.window_seconds = 60
        self.requests_log: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        # Skip health endpoints from rate limiting
        if request.url.path in ("/health", "/ready", "/live"):
            res: Response = await call_next(request)
            return res

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - self.window_seconds

        # Prune older timestamps
        recent_timestamps = [t for t in self.requests_log[client_ip] if t > window_start]
        self.requests_log[client_ip] = recent_timestamps

        if len(recent_timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please slow down your requests.",
                    "retry_after_seconds": int(self.window_seconds - (now - recent_timestamps[0])),
                },
                headers={
                    "Retry-After": str(int(self.window_seconds - (now - recent_timestamps[0]))),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        self.requests_log[client_ip].append(now)
        final_res = await call_next(request)
        response: Response = final_res
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.max_requests - len(self.requests_log[client_ip]))
        )
        return response
