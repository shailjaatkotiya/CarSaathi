"""Low-level Twilio WhatsApp sender. No DB, no app models — just the API call.

Shared by the synchronous request path (app.services.whatsapp) and the Celery
worker (app.tasks.whatsapp_tasks).
"""
import json
import logging

from app.core.config import get_settings
from app.models import NotificationStatus

logger = logging.getLogger("ridesaathi.whatsapp.twilio")


def e164(number: str) -> str:
    """Best-effort normalise an Indian mobile to E.164 (+91XXXXXXXXXX)."""
    n = (number or "").strip().replace(" ", "").replace("-", "")
    if n.startswith("+"):
        return n
    if len(n) == 10:
        return f"+91{n}"
    return f"+{n}"


def send_via_twilio(
    recipient: str,
    body: str,
    content_sid: str | None = None,
    content_variables: dict | None = None,
) -> NotificationStatus:
    """Send one WhatsApp message. Returns sent / failed. Never raises."""
    settings = get_settings()
    if not recipient or recipient == "missing":
        logger.warning("twilio send skipped: no recipient")
        return NotificationStatus.failed

    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        params: dict = {"to": f"whatsapp:{e164(recipient)}"}

        if settings.twilio_messaging_service_sid:
            params["messaging_service_sid"] = settings.twilio_messaging_service_sid
        else:
            params["from_"] = f"whatsapp:{settings.twilio_whatsapp_from}"

        if content_sid:
            # Business-initiated: approved WhatsApp template via Content API.
            params["content_sid"] = content_sid
            params["content_variables"] = json.dumps(content_variables or {})
        else:
            # Freeform (sandbox / within 24h customer-service window).
            params["body"] = body

        client.messages.create(**params)
        return NotificationStatus.sent
    except Exception:  # noqa: BLE001 - messaging must never break the caller
        logger.exception("twilio whatsapp send failed to=%s", recipient)
        return NotificationStatus.failed
