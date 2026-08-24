"""
Expo Push Notifications helper.

Sends notifications via the official Expo Push API. No credentials required
(Expo Push Service is free for dev + production). Works for both iOS and
Android. Uses httpx.AsyncClient so it can be awaited inside FastAPI routes
or fire-and-forget tasks.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Iterable, List, Optional

import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
logger = logging.getLogger(__name__)


def _is_valid_expo_token(token: Any) -> bool:
    return (
        isinstance(token, str)
        and (token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken["))
        and token.endswith("]")
    )


async def send_expo_push(
    tokens: Iterable[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
    channel_id: str = "default",
    image: Optional[str] = None,
) -> dict:
    """Send a single notification to one or more Expo tokens.

    Returns a dict with counts. Invalid tokens are silently skipped.
    Failures are logged but never raise — notifications are best-effort.

    `image`, if given, must be a public HTTPS URL (not a data: URI or local
    file) — it's fetched by Apple/Google's push infrastructure outside the
    app process, so anything not reachable over the network won't render.
    Shown as a rich-notification image on iOS (via Expo's richContent) and
    passed through `data.image` so the client can use it too (e.g. Android
    big-picture style, or an in-app notification feed).
    """
    unique_valid = list({t for t in tokens if _is_valid_expo_token(t)})
    if not unique_valid:
        return {"sent": 0, "invalid": 0, "errors": []}

    merged_data = dict(data or {})
    if image:
        merged_data["image"] = image

    messages: List[dict] = [
        {
            "to": t,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "channelId": channel_id,
            "data": merged_data,
            **({"richContent": {"image": image}, "mutableContent": True} if image else {}),
        }
        for t in unique_valid
    ]

    sent, errors = 0, []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Expo accepts up to 100 messages per request
            for i in range(0, len(messages), 100):
                batch = messages[i : i + 100]
                try:
                    r = await client.post(
                        EXPO_PUSH_URL,
                        headers={
                            "Accept": "application/json",
                            "Accept-encoding": "gzip, deflate",
                            "Content-Type": "application/json",
                        },
                        json=batch,
                    )
                    if r.status_code >= 400:
                        errors.append(f"http {r.status_code}: {r.text[:200]}")
                        continue
                    payload = r.json()
                    data_list = payload.get("data", []) if isinstance(payload, dict) else []
                    for item in data_list:
                        if isinstance(item, dict) and item.get("status") == "ok":
                            sent += 1
                        else:
                            errors.append(str(item))
                except Exception as ex:  # noqa: BLE001
                    errors.append(str(ex))
    except Exception as outer:  # noqa: BLE001
        errors.append(str(outer))

    if errors:
        logger.warning("Expo push partial/failed: %s", errors[:3])
    return {"sent": sent, "invalid": 0, "errors": errors, "total": len(messages)}


def fire_and_forget_push(
    tokens: Iterable[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> None:
    """Schedule a push send without awaiting. Safe to call from inside a route."""
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(send_expo_push(list(tokens), title, body, data or {}))
    except Exception as e:  # noqa: BLE001
        logger.warning("fire_and_forget_push failed: %s", e)
