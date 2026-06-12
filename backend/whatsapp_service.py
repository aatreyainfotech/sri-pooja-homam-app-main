"""WhatsApp OTP delivery via Meta Cloud API (WhatsApp Business Platform).

Setup checklist
---------------
1. Create a Meta Business account at https://business.facebook.com
2. Create a WhatsApp Business App at https://developers.facebook.com/apps
3. Note your **Phone Number ID** and generate a **System User Access Token**
   (or a temporary test token for development).
4. In Meta Business Manager → WhatsApp → Message Templates, create an
   *Authentication* template (e.g. name: ``sph_otp``).
   The body should contain one variable {{1}} for the OTP code.
   Example body: "Your Sri Pooja Homam OTP is {{1}}. Valid for 10 minutes."
5. Set .env vars:
       META_WHATSAPP_TOKEN    = <permanent system-user token>
       META_PHONE_NUMBER_ID   = <15-digit phone number ID from dashboard>
       META_OTP_TEMPLATE_NAME = sph_otp          (your template name)
       META_OTP_TEMPLATE_LANG = en_US             (template language code)
"""

import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)

_META_GRAPH_VERSION = "v20.0"
_META_API_BASE = "https://graph.facebook.com"

# ---------------------------------------------------------------------------
# Config (loaded from environment at module import time)
# ---------------------------------------------------------------------------
_TOKEN = os.environ.get("META_WHATSAPP_TOKEN", "")
_PHONE_NUMBER_ID = os.environ.get("META_PHONE_NUMBER_ID", "")
_TEMPLATE_NAME = os.environ.get("META_OTP_TEMPLATE_NAME", "sph_otp")
_TEMPLATE_LANG = os.environ.get("META_OTP_TEMPLATE_LANG", "en_US")
_WELCOME_TEMPLATE_NAME = os.environ.get("META_WELCOME_TEMPLATE_NAME", "sph_welcome")
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
    # strip leading + if present (already handled by re.sub)
    return digits


async def send_otp(mobile: str, otp: str) -> bool:
    """Send *otp* to *mobile* via Meta WhatsApp Cloud API template message.

    Returns True on success, False on failure (errors are logged).
    The caller should decide whether to surface errors to the end user.
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
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": otp}],
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
            logger.info("[WhatsApp] OTP sent to +%s (template: %s)", to, _TEMPLATE_NAME)
            return True

        logger.error(
            "[WhatsApp] API error %s → %s",
            resp.status_code,
            resp.text[:400],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending OTP: %s", exc)
        return False


async def send_welcome(mobile: str, full_name: str) -> bool:
    """Send a welcome message to a newly registered user via WhatsApp template.

    Template ``sph_welcome`` (utility type) — create in Meta Business Manager.

    Suggested template body (2 variables):
        "Welcome to Sri Pooja Homam, {{1}}! 🙏
    Your registration is complete. May the divine blessings be with you.
    Visit us at https://sri.aatreya.org"

    Variable mapping:
        {{1}} → user's full name
    """
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
            "[WhatsApp] Welcome API error %s → %s",
            resp.status_code,
            resp.text[:400],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending welcome: %s", exc)
        return False


async def send_booking_confirmation(
    mobile: str,
    full_name: str,
    pooja_name: str,
    booking_id: str,
    payment_id: str,
    amount: float,
) -> bool:
    """Send booking confirmation via WhatsApp template ``sri_bc``.

    Template variables (body parameters):
        {{1}} = devotee full name
        {{2}} = pooja / homam name
        {{3}} = booking ID (short)
        {{4}} = payment ID
        {{5}} = amount (e.g. ₹500)
        {{6}} = status (CONFIRMED)
    """
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
            "[WhatsApp] Booking confirm API error %s → %s",
            resp.status_code,
            resp.text[:400],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("[WhatsApp] Network error sending booking confirmation: %s", exc)
        return False
