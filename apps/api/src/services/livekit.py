import time

import jwt

from src.core.config import settings
from src.core.logging import logger

try:
    from livekit import api
    HAS_LIVEKIT_SDK = True
except ImportError:
    HAS_LIVEKIT_SDK = False


def generate_livekit_token(
    room_name: str,
    participant_identity: str,
    participant_name: str,
    ttl_seconds: int = 3600,
) -> str:
    """
    Mints a secure, short-lived LiveKit room token.
    Uses official livekit-api if available, with pure JWT fallback.
    """
    if HAS_LIVEKIT_SDK:
        try:
            token = (
                api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
                .with_identity(participant_identity)
                .with_name(participant_name)
                .with_grants(
                    api.VideoGrants(
                        room_join=True,
                        room=room_name,
                        can_publish=True,
                        can_subscribe=True,
                        can_publish_data=True,
                    )
                )
                .to_jwt()
            )
            return str(token)
        except Exception as e:
            logger.warning(f"Error using livekit-api SDK, falling back to pure JWT: {e}")

    # Pure JWT fallback conforming to LiveKit token specs
    now = int(time.time())
    payload = {
        "exp": now + ttl_seconds,
        "iss": settings.LIVEKIT_API_KEY,
        "nbf": now - 5,
        "sub": participant_identity,
        "name": participant_name,
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True,
        },
    }
    return jwt.encode(payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")
