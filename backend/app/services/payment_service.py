"""Payment provider workflows."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.models import BookingStatus
from app.repositories.booking_repository import BookingRepository
from app.services import razorpay_client
from app.services.whatsapp import notify_booking_created


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.bookings = BookingRepository(db)

    def handle_razorpay_webhook(
        self, raw_body: bytes, signature: str, event: dict
    ) -> str:
        if not razorpay_client.verify_webhook_signature(raw_body, signature):
            raise ValidationError("Invalid signature")

        entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = entity.get("order_id")
        payment_id = entity.get("id")
        if not order_id:
            return "ignored"

        booking = self.bookings.get_by_order_id(order_id)
        if booking and booking.payment and booking.payment.status != "paid":
            booking.payment.status = "paid"
            booking.payment.provider_reference = payment_id
            booking.status = (
                BookingStatus.confirmed
                if booking.ride.auto_confirm_bookings
                else BookingStatus.pending
            )
            notify_booking_created(self.db, booking)
            self.db.commit()

        return "ok"
