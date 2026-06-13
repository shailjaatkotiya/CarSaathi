"""Thin wrapper around Razorpay for online ride payments.

Razorpay only handles the ``online`` payment method. Cash bookings never touch
this module. When the key/secret are not configured, ``is_configured`` returns
False so the API can reject online payments cleanly while cash keeps working.

Signature verification is done with a local HMAC-SHA256 so it works even if the
``razorpay`` SDK is not installed; the SDK is only imported (lazily) when an
order actually needs to be created.
"""

from __future__ import annotations

import hashlib
import hmac

from app.core.config import get_settings

settings = get_settings()


def is_configured() -> bool:
    return bool(settings.razorpay_key_id and settings.razorpay_key_secret)


def create_order(amount_rupees: int, receipt: str) -> dict:
    """Create a Razorpay order. Amount is converted rupees -> paise (x100)."""
    import razorpay  # lazy: only needed when online payment is actually used

    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    return client.order.create(
        {
            "amount": amount_rupees * 100,
            "currency": settings.payment_currency,
            "receipt": receipt,
            "payment_capture": 1,
        }
    )


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify the checkout callback signature: HMAC(order_id|payment_id)."""
    if not (order_id and payment_id and signature):
        return False
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    """Verify a webhook payload against the configured webhook secret."""
    if not (settings.razorpay_webhook_secret and signature):
        return False
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
