"""
Agora Live Broadcasting helper — token generation + service status.

Uses agora-token-builder (Python). Fully graceful degradation: if AGORA_APP_ID
or AGORA_APP_CERTIFICATE are empty, endpoints return 503 with a clear message
so the UI can show a friendly "Live broadcasting not configured" state.
"""

from __future__ import annotations

import os
import time
from typing import Optional

try:
    from agora_token_builder import RtcTokenBuilder
    _HAS_BUILDER = True
except Exception:  # noqa: BLE001
    _HAS_BUILDER = False


# Role constants (match Agora SDK)
ROLE_PUBLISHER = 1
ROLE_SUBSCRIBER = 2


def is_configured() -> bool:
    app_id = os.getenv("AGORA_APP_ID", "").strip()
    app_cert = os.getenv("AGORA_APP_CERTIFICATE", "").strip()
    return bool(app_id) and bool(app_cert) and _HAS_BUILDER


def get_app_id() -> str:
    return os.getenv("AGORA_APP_ID", "").strip()


def build_rtc_token(
    channel_name: str,
    uid: int,
    role: str = "publisher",
    ttl_seconds: int = 3600,
) -> Optional[dict]:
    """Return {token, app_id, channel_name, uid, expires_at} or None if not configured."""
    if not is_configured():
        return None
    app_id = os.getenv("AGORA_APP_ID", "").strip()
    app_cert = os.getenv("AGORA_APP_CERTIFICATE", "").strip()
    role_int = ROLE_PUBLISHER if role == "publisher" else ROLE_SUBSCRIBER
    expire_ts = int(time.time()) + max(60, int(ttl_seconds))

    token = RtcTokenBuilder.buildTokenWithUid(
        app_id, app_cert, channel_name, int(uid), role_int, expire_ts
    )
    return {
        "token": token,
        "app_id": app_id,
        "channel_name": channel_name,
        "uid": int(uid),
        "role": role,
        "expires_at": expire_ts,
    }
