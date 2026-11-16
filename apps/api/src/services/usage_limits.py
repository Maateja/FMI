"""
Phase 4: Usage Limits Service

Enforces per-user interview quotas with daily and total caps.
Backed by the `usage_limits` DB table (daily_limit=5, total_limit=30).
Falls back to in-memory tracking when Supabase is unavailable.
"""

from datetime import UTC, date, datetime
from typing import Any

from pydantic import BaseModel

from src.core.database import get_supabase_admin_client
from src.core.logging import logger


class UsageLimits(BaseModel):
    """User's current quota state."""

    user_id: str
    interviews_today: int = 0
    interviews_total: int = 0
    daily_limit: int = 5
    total_limit: int = 30
    last_reset_date: date = date.today()
    can_start: bool = True
    reason: str = ""


# In-memory fallback tracker (dev/offline mode)
_mem_usage: dict[str, dict[str, Any]] = {}


def _get_mem_record(user_id: str) -> dict[str, Any]:
    """Returns or initialises an in-memory usage record."""
    if user_id not in _mem_usage:
        _mem_usage[user_id] = {
            "interviews_today": 0,
            "interviews_total": 0,
            "daily_limit": 5,
            "total_limit": 30,
            "last_reset_date": date.today(),
        }
    rec = _mem_usage[user_id]

    # Daily reset if the date has rolled over
    if rec["last_reset_date"] < date.today():
        rec["interviews_today"] = 0
        rec["last_reset_date"] = date.today()

    return rec


async def get_usage(user_id: str) -> UsageLimits:
    """Fetches the current usage state for a user."""
    # Try Supabase first
    try:
        client = get_supabase_admin_client()
        result = (
            client.table("usage_limits")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if result.data:
            row = result.data[0]
            last_reset = date.fromisoformat(str(row["last_reset_date"]))
            today_count = int(row["interviews_conducted_count"])

            # Server-side daily reset
            if last_reset < date.today():
                today_count = 0

            daily_lim = int(row["daily_limit"])
            total_lim = int(row["total_limit"])
            can_start = today_count < daily_lim and today_count < total_lim
            reason = ""
            if today_count >= daily_lim:
                reason = (
                    f"Daily interview limit reached ({daily_lim}). "
                    "Come back tomorrow for more practice!"
                )
            elif today_count >= total_lim:
                reason = (
                    f"Total interview limit reached ({total_lim}). "
                    "Contact support for additional sessions."
                )

            return UsageLimits(
                user_id=user_id,
                interviews_today=today_count,
                interviews_total=today_count,
                daily_limit=daily_lim,
                total_limit=total_lim,
                last_reset_date=last_reset,
                can_start=can_start,
                reason=reason,
            )
    except Exception as e:
        logger.info(f"Using in-memory usage tracking (DB unavailable): {e}")

    # Fallback to in-memory
    rec = _get_mem_record(user_id)
    today = rec["interviews_today"]
    total = rec["interviews_total"]
    daily_lim = rec["daily_limit"]
    total_lim = rec["total_limit"]

    can_start = today < daily_lim and total < total_lim
    reason = ""
    if today >= daily_lim:
        reason = (
            f"Daily interview limit reached ({daily_lim}). "
            "Come back tomorrow for more practice!"
        )
    elif total >= total_lim:
        reason = (
            f"Total interview limit reached ({total_lim}). "
            "Contact support for additional sessions."
        )

    return UsageLimits(
        user_id=user_id,
        interviews_today=today,
        interviews_total=total,
        daily_limit=daily_lim,
        total_limit=total_lim,
        last_reset_date=rec["last_reset_date"],
        can_start=can_start,
        reason=reason,
    )


async def increment_usage(user_id: str) -> UsageLimits:
    """Increments interview count after a successful session start."""
    # Try Supabase first
    try:
        client = get_supabase_admin_client()
        result = (
            client.table("usage_limits")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if result.data:
            row = result.data[0]
            last_reset = date.fromisoformat(str(row["last_reset_date"]))
            current_count = int(row["interviews_conducted_count"])

            if last_reset < date.today():
                current_count = 0

            new_count = current_count + 1
            client.table("usage_limits").update({
                "interviews_conducted_count": new_count,
                "last_reset_date": date.today().isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }).eq("user_id", user_id).execute()

            return await get_usage(user_id)
    except Exception as e:
        logger.info(f"In-memory usage increment (DB unavailable): {e}")

    # Fallback to in-memory
    rec = _get_mem_record(user_id)
    rec["interviews_today"] += 1
    rec["interviews_total"] += 1
    return await get_usage(user_id)


def reset_mem_usage() -> None:
    """Clears in-memory usage state (for testing)."""
    _mem_usage.clear()
