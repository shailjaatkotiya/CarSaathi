from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ridesaathi",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_acks_late=True,
    task_default_retry_delay=10,
    task_max_retries=3,
)

# Ensure task modules are imported so Celery registers them.
celery_app.autodiscover_tasks(["app.tasks"])
import app.tasks.whatsapp_tasks  # noqa: E402,F401
