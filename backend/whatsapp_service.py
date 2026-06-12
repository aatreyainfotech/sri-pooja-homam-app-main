"""WhatsApp OTP delivery via Meta Cloud API (WhatsApp Business Platform).

Template categories:
- AUTHENTICATION (CAPI) templates like sri_otp: need body + button components
- UTILITY (MM_LITE) templates: body component only

Set META_OTP_TEMPLATE_HAS_BUTTON=true when using an Authentication-category
template that has a "Copy code" or "One-tap" button (CAPI templates).
"""

import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)

_META_GRAPH_VERSION = "v25.0"
_META_API_BASE = "https://graph.facebook.com"

# ---------------------------------------------------------------------------
# Config (loaded from environment at module import time)
# ---------------------------------------------------------------------------
_TOKEN = os.environ.get("META_WHATSAPP_TOKEN", "")
_PHONE_NUMBER_ID = os.environ.get("META_PHONE_NUMBER_ID", "")
_TEMPLATE_NAME = os.environ.get("META_OTP_TEMPLATE_NAME", "sri_otp")
_TEMPLATE_LANG = os.environ.get("META_OTP_TEMPLATE_LANG", "en_US")
# Set to "true" if sri_otp is an Authentication category template (CAPI/has button)
_TEMPLATE_HAS_BUTTON = os.environ.get("META_OTP_TEMPLATE_HAS_BUTTON", "true").lower() == "true"

_WELCOME_TEMPLATE_NAME = os.environ.get("META_WELCOME_TEMPLATE_NAME", "sri_welcome")
_WELCOME_TEMPLATE_LANG = os.environ.get("META_WELCOME_TEMPLATE_LANG", "en_US")
_BOOKING_TEMPLATE_NAME = os.environ.get("META_BOOKING_TEMPLATE_NAME", "sri_bc")
_BOOKING_TEMPLATE_LANG = os.environ.get("META_BOOKING_TEMPLATE_LANG", "en_US")


def is_configured() -> bool:
    """Return True when all required env vars are present."""
    return bool(_TOKEN and _PHONE_NUMBER_ID)


def _normalise_mobile(mobile: str) -> str:
    """Convert mobile to full international format required by WhatsApp API.

    Accepts:
    - 10-digit Indian numbers  : 9876543210  → 919876543210
    - Already prefixed         : +919876543210 / 919876543210 → 919876543210
    """
    digits = re.sub(r"\D", "", mobile)
    if len(digits) == 10:
        return "91" + digits          # assume India (+91)
    if digits.startswith("0"):
        digits = "91" + digits[1:]    # strip leading 0, add country code
    return digits


def _otp_components(otp: str) -> list:
    """Build template components for OTP.

    Authentication-category templates (CAPI, e.g. sri_otp) require both:
      - body component with {{1}} = OTP text
      - button component (sub_type=url, index=0) with the OTP as the URL suffix

    Utility templates (MM_LITE) only need the body component.
    """
    components = [
        {
            "type": "body",
            "parameters": [{"type": "text", "text": otp}],
        }
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
    """Send *otp* to *mobile* via Meta WhatsApp Cloud API template message.

    Returns True on success, False on failure (errors are logged).
    """
    if not is_configured():
        logger.warning(
            "[WhatsApp] META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID not set — "
            "OTP NOT sent (configure .env or Azure App Settings)."
        )
        return False

    to = _normalise_mobile(mobile)
    url = f"{_META_API_BASE}/{_META_GRAPH_VERSION}/{_PHONE_NUMBER_ID}/messages"

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

    headers = {
        "Authorization": f"Bearer {_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code == 200:
            logger.info("[WhatsApp] OTP sent to +%s (template: %s)", to, _TEMPLATE_NAME)
            return True

        # Log full error so Azure App Service logs show exact Meta API error
        logger.error(
            "[WhatsApp] OTP API error %s | to=%s | template=%s | response=%s",
            resp.status_code, to, _TEMPLATE_NAME, resp.text[:600],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending OTP to +%s: %s", to, exc)
        return False


async def send_welcome(mobile: str, full_name: str) -> bool:
    """Send a welcome message to a newly registered user."""
    if not is_configured():
        logger.warning("[WhatsApp] Welcome message NOT sent — META_* env vars missing.")
        return False

    to = _normalise_mobile(mobile)
    url = f"{_META_API_BASE}/{_META_GRAPH_VERSION}/{_PHONE_NUMBER_ID}/messages"

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _WELCOME_TEMPLATE_NAME,
            "language": {"code": _WELCOME_TEMPLATE_LANG},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": full_name}],
                }
            ],
        },
    }

    headers = {
        "Authorization": f"Bearer {_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code == 200:
            logger.info("[WhatsApp] Welcome sent to +%s (%s)", to, full_name)
            return True

        logger.error(
            "[WhatsApp] Welcome API error %s | to=%s | response=%s",
            resp.status_code, to, resp.text[:400],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending welcome to +%s: %s", to, exc)
        return False


async def send_booking_confirmation(
    mobile: str,
    full_name: str,
    pooja_name: str,
    booking_id: str,
    payment_id: str,
    amount: float,
) -> bool:
    """Send booking confirmation via WhatsApp template ``sri_bc``."""
    if not is_configured():
        logger.warning("[WhatsApp] Booking confirmation NOT sent — META_* env vars missing.")
        return False

    to = _normalise_mobile(mobile)
    url = f"{_META_API_BASE}/{_META_GRAPH_VERSION}/{_PHONE_NUMBER_ID}/messages"

    params = [
        {"type": "text", "text": full_name},
        {"type": "text", "text": pooja_name},
        {"type": "text", "text": booking_id[:12]},
        {"type": "text", "text": payment_id},
        {"type": "text", "text": f"₹{int(amount)}"},
        {"type": "text", "text": "CONFIRMED"},
    ]

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": _BOOKING_TEMPLATE_NAME,
            "language": {"code": _BOOKING_TEMPLATE_LANG},
            "components": [{"type": "body", "parameters": params}],
        },
    }

    headers = {
        "Authorization": f"Bearer {_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code == 200:
            logger.info("[WhatsApp] Booking confirmation sent to +%s (%s)", to, pooja_name)
            return True

        logger.error(
            "[WhatsApp] Booking confirm API error %s | to=%s | response=%s",
            resp.status_code, to, resp.text[:400],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending booking confirmation to +%s: %s", to, exc)
        return False


async def test_send(mobile: str, otp: str = "123456") -> dict:
    """Test OTP send and return full Meta API response (for /admin/whatsapp-test endpoint)."""
    to = _normalise_mobile(mobile)
    url = f"{_META_API_BASE}/{_META_GRAPH_VERSION}/{_PHONE_NUMBER_ID}/messages"

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

    headers = {
        "Authorization": f"Bearer {_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
        return {
            "status_code": resp.status_code,
            "ok": resp.status_code == 200,
            "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text,
            "to": to,
            "template": _TEMPLATE_NAME,
            "has_button": _TEMPLATE_HAS_BUTTON,
            "phone_number_id": _PHONE_NUMBER_ID,
            "token_prefix": _TOKEN[:20] + "..." if _TOKEN else "NOT SET",
        }
    except Exception as exc:
        return {"ok": False, "error": str(exc), "to": to}
