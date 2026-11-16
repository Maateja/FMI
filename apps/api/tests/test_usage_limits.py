import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.usage_limits import (
    _get_mem_record,
    get_usage,
    increment_usage,
    reset_mem_usage,
)


@pytest.fixture(autouse=True)
def clean_usage():
    reset_mem_usage()
    yield
    reset_mem_usage()


@pytest.mark.asyncio
async def test_usage_limits_initial_state():
    user_id = "test-user-limit-1"
    usage = await get_usage(user_id)
    assert usage.user_id == user_id
    assert usage.interviews_today == 0
    assert usage.daily_limit == 5
    assert usage.total_limit == 30
    assert usage.can_start is True
    assert usage.reason == ""


@pytest.mark.asyncio
async def test_usage_limits_increment_and_cap():
    user_id = "test-user-limit-2"

    for _ in range(5):
        usage = await increment_usage(user_id)

    assert usage.interviews_today == 5
    assert usage.can_start is False
    assert "Daily interview limit reached" in usage.reason


@pytest.mark.asyncio
async def test_total_limit_cap():
    user_id = "test-user-limit-3"
    rec = _get_mem_record(user_id)
    rec["interviews_today"] = 2
    rec["interviews_total"] = 30

    usage = await get_usage(user_id)
    assert usage.can_start is False
    assert "Total interview limit reached" in usage.reason


def test_usage_me_api_endpoint():
    from tests.test_auth import create_test_jwt

    client = TestClient(app)
    token = create_test_jwt("user-usage-test", "usage@example.com")
    resp = client.get(
        "/api/v1/interviews/usage/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == "user-usage-test"
    assert data["daily_limit"] == 5
    assert data["can_start"] is True
