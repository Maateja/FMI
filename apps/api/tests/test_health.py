import pytest

from src.routes.health import health_check, readiness_check


@pytest.mark.asyncio
async def test_health_check_function():
    res = await health_check()
    assert res["status"] == "healthy"
    assert res["service"] == "fmi-api"


@pytest.mark.asyncio
async def test_readiness_check_function():
    res = await readiness_check()
    assert res["status"] == "ready"
    assert res["service"] == "fmi-api"
