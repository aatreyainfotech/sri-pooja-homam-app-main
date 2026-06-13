"""WhatsApp messaging via Meta Cloud API v18.0 (matches working yatra_pass pattern).

OTP template uses body-only (no button component). Meta adds Copy Code button automatically
for Authentication-category templates. Default: body-only (confirmed working).
Env vars accepted (both old META_* and new WHATSAPP_* names):
  WHATSAPP_TOKEN          or META_WHATSAPP_TOKEN
  WHATSAPP_PHONE_NUMBER_ID or META_PHONE_NUMBER_ID
  WHATSAPP_COUNTRY_CODE   (default: 91)
"""

import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)

_META_GRAPH_VERSION = "v18.0"          # same as working yatra_pass code
_META_API_BASE = "https://graph.facebook.com"

# ---------------------------------------------------------------------------
# Config — accepts both WHATSAPP_* (preferred) and META_* (legacy) names
# ---------------------------------------------------------------------------
_TOKEN = (os.environ.get("WHATSAPP_TOKEN") or os.environ.get("META_WHATSAPP_TOKEN", "")).strip()
_PHONE_NUMBER_ID = (os.environ.get("WHATSAPP_PHONE_NUMBER_ID") or os.environ.get("META_PHONE_NUMBER_ID", "")).strip()
_COUNTRY_CODE = os.environ.get("WHATSAPP_COUNTRY_CODE", "91").strip()

_TEMPLATE_NAME = os.environ.get("META_OTP_TEMPLATE_NAME", "sri_otp").strip()
_TEMPLATE_LANG = os.environ.get("META_OTP_TEMPLATE_LANG", "en_US").strip()
# sri_otp Authentication template: Meta adds Copy Code button automatically — send body-only
_TEMPLATE_HAS_BUTTON = os.environ.get("META_OTP_TEMPLATE_HAS_BUTTON", "false").lower() == "true"

_WELCOME_TEMPLATE_NAME = os.environ.get("META_WELCOME_TEMPLATE_NAME", "sri_welcome").strip()
_WELCOME_TEMPLATE_LANG = os.environ.get("META_WELCOME_TEMPLATE_LANG", "en_US").strip()
_BOOKING_TEMPLATE_NAME = os.environ.get("META_BOOKING_TEMPLATE_NAME", "sri_bc").strip()
_BOOKING_TEMPLATE_LANG = os.environ.get("META_BOOKING_TEMPLATE_LANG", "en_US").strip()


def is_configured() -> bool:
    return bool(_TOKEN and _PHONE_NUMBER_ID)


def _normalise_mobile(mobile: str) -> str:
    """Return full international number: 9876543210 → 919876543210."""
    digits = re.sub(r"\D", "", str(mobile or ""))
    cc = _COUNTRY_CODE
    if digits.startswith(cc) and len(digits) > 10:
        return digits          # already has country code
    if len(digits) == 10:
        return cc + digits
    if digits.startswith("0"):
        return cc + digits[1:]
    return digits


def _build_url() -> str:
    return f"{_META_API_BASE}/{_META_GRAPH_VERSION}/{_PHONE_NUMBER_ID}/messages"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_TOKEN}",
        "Content-Type": "application/json",
    }


def _otp_components(otp: str) -> list:
    """Body-only by default; add button only when template requires it."""
    components = [
        {"type": "body", "parameters": [{"type": "text", "text": otp}]}
    ]
    if _TEMPLATE_HAS_BUTTON:
        components.append({
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [{"type": "text", "text": otp}],
        })
    return components


async def send_otp(mobile: str, otp: str) -> bool:
    """Send OTP via WhatsApp template. Returns True on success."""
    if not is_configured():
        logger.warning("[WhatsApp] Token/PhoneID not set — OTP skipped.")
        return False

    to = _normalise_mobile(mobile)
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _TEMPLATE_NAME,
            "language": {"code": _TEMPLATE_LANG},
            "components": _otp_components(otp),
        },
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(_build_url(), json=payload, headers=_headers())
        if resp.status_code == 200:
            logger.info("[WhatsApp] OTP sent to +%s", to)
            return True
        logger.error("[WhatsApp] OTP failed %s | to=%s | body=%s",
                     resp.status_code, to, resp.text[:600])
        return False
    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error (OTP) +%s: %s", to, exc)
        return False


async def send_welcome(mobile: str, full_name: str) -> bool:
    """Send welcome message after registration."""
    if not is_configured():
        return False

    to = _normalise_mobile(mobile)
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _WELCOME_TEMPLATE_NAME,
            "language": {"code": _WELCOME_TEMPLATE_LANG},
            "components": [
                {"type": "body", "parameters": [{"type": "text", "text": full_name}]}
            ],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(_build_url(), json=payload, headers=_headers())
        if resp.status_code == 200:
            logger.info("[WhatsApp] Welcome sent to +%s (%s)", to, full_name)
            return True
        logger.error("[WhatsApp] Welcome failed %s | to=%s | body=%s",
                     resp.status_code, to, resp.text[:400])
        return False
    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error (welcome) +%s: %s", to, exc)
        return False


async def send_booking_confirmation(
    mobile: str,
    full_name: str,
    pooja_name: str,
    booking_id: str,
    payment_id: str,
    amount: float,
) -> bool:
    """Send payment confirmation via sri_bc template."""
    if not is_configured():
        return False

    to = _normalise_mobile(mobile)
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _BOOKING_TEMPLATE_NAME,
            "language": {"code": _BOOKING_TEMPLATE_LANG},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": full_name},
                        {"type": "text", "text": pooja_name},
                        {"type": "text", "text": booking_id[:12]},
                        {"type": "text", "text": payment_id},
                        {"type": "text", "text": f"₹{int(amount)}"},
                        {"type": "text", "text": "CONFIRMED"},
                    ],
                }
            ],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(_build_url(), json=payload, headers=_headers())
        if resp.status_code == 200:
            logger.info("[WhatsApp] Booking confirm sent to +%s (%s)", to, pooja_name)
            return True
        logger.error("[WhatsApp] Booking confirm failed %s | to=%s | body=%s",
                     resp.status_code, to, resp.text[:400])
        return False
    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error (booking) +%s: %s", to, exc)
        return False


async def test_send(mobile: str, otp: str = "123456") -> dict:
    """Full diagnostic: send test OTP and return raw Meta API response."""
    to = _normalise_mobile(mobile)
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _TEMPLATE_NAME,
            "language": {"code": _TEMPLATE_LANG},
            "components": _otp_components(otp),
        },
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(_build_url(), json=payload, headers=_headers())
        return {
            "ok": resp.status_code == 200,
            "status_code": resp.status_code,
            "response": resp.json() if "application/json" in resp.headers.get("content-type", "") else resp.text,
            "to": to,
            "api_version": _META_GRAPH_VERSION,
            "template": _TEMPLATE_NAME,
            "template_lang": _TEMPLATE_LANG,
            "has_button": _TEMPLATE_HAS_BUTTON,
            "phone_number_id": _PHONE_NUMBER_ID,
            "token_prefix": (_TOKEN[:20] + "...") if _TOKEN else "NOT SET",
            "configured": is_configured(),
        }
    except Exception as exc:
        return {
            "ok": False,
            "error": str(exc),
            "to": to,
            "configured": is_configured(),
        }
