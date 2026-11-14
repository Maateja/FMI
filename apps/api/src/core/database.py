
from supabase import Client, create_client

from src.core.config import settings
from src.core.logging import logger

_supabase_client: Client | None = None
_supabase_admin_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        except Exception as e:
            logger.warning(f"Could not connect to Supabase: {e}")
            raise
    return _supabase_client


def get_supabase_admin_client() -> Client:
    global _supabase_admin_client
    if _supabase_admin_client is None:
        try:
            _supabase_admin_client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            logger.warning(f"Could not connect to Supabase Admin: {e}")
            raise
    return _supabase_admin_client
