"""Celery task that actually delivers a WhatsApp message via Twilio.

Kept separate from app.services.whatsapp so the request path can enqueue work
without importing Twisted/Celery internals, and so the worker can run the send
in its own DB session.
"""
import logging

from app.database import SessionLocal
from app.models import NotificationLog, NotificationStatus
from app.services.twilio_client import send_via_twilio
from app.worker import celery_app

logger = logging.getLogger("ridesaathi.whatsapp.task")


@celery_app.task(bind=True, name="whatsapp.send", max_retries=3)
def send_whatsapp_message(
    self,
    log_id: int,
    recipient: str,
    body: str,
    content_sid: str | None = None,
    content_variables: dict | None = None,
) -> str:
    status = send_via_twilio(recipient, body, content_sid, content_variables)

    # Persist final status back onto the NotificationLog row.
    db = SessionLocal()
    try:
        log = db.get(NotificationLog, log_id)
        if log:
            log.status = status
            db.commit()
    finally:
        db.close()

    if status == NotificationStatus.failed:
        # Retry transient failures; gives up after max_retries then stays "failed".
        raise self.retry(countdown=10)
    return status.value
