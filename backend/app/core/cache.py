"""Redis-backed cache helpers.

Caching is optional: when REDIS_URL is unset or Redis is unreachable, every
helper degrades to a no-op so the API keeps serving straight from the
database.
"""

import hashlib
import json
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

RIDES_VERSION_KEY = "rides:version"

_client = None


def get_client():
    global _client
    settings = get_settings()
    if not settings.redis_url:
        return None
    if _client is None:
        import redis

        _client = redis.Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _client


def _rides_version(client) -> str:
    return client.get(RIDES_VERSION_KEY) or "0"


def ride_search_key(params: dict[str, Any]) -> str:
    payload = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


def get_cached_ride_search(params: dict[str, Any]) -> list[dict] | None:
    client = get_client()
    if client is None:
        return None
    try:
        key = f"rides:v{_rides_version(client)}:search:{ride_search_key(params)}"
        cached = client.get(key)
        return json.loads(cached) if cached else None
    except Exception:
        logger.warning("Redis read failed, serving from database", exc_info=True)
        return None


def set_cached_ride_search(params: dict[str, Any], results: list[dict]) -> None:
    client = get_client()
    if client is None:
        return
    settings = get_settings()
    try:
        key = f"rides:v{_rides_version(client)}:search:{ride_search_key(params)}"
        client.setex(key, settings.ride_search_cache_ttl, json.dumps(results))
    except Exception:
        logger.warning("Redis write failed, skipping cache", exc_info=True)


def bump_rides_version() -> None:
    """Invalidate all cached ride searches after any ride/seat mutation.

    Old keys become unreachable (version prefix changes) and expire via TTL.
    """
    client = get_client()
    if client is None:
        return
    try:
        client.incr(RIDES_VERSION_KEY)
    except Exception:
        logger.warning("Redis invalidation failed", exc_info=True)
