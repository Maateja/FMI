from fastapi.testclient import TestClient

from src.main import app


def test_security_headers_present():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin" in response.headers.get("Referrer-Policy", "")


def test_rate_limiting_headers():
    client = TestClient(app)
    response = client.get("/api/v1/questions")
    # Public or auth route returns rate limit headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
