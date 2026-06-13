"""Public Razorpay webhook endpoint (no auth - Razorpay calls it directly).

This is the trustworthy server-to-server confirmation. The browser callback
(/passenger/payments/verify) is the fast path; this webhook is the backstop so a
booking still gets confirmed if the user closes the tab mid-payment. Both paths
are idempotent - whichever lands first marks the payment paid, the other no-ops.

Configure the URL (https://<your-domain>/api/v1/payments/webhook) and the secret
in the Razorpay dashboard, and set RAZORPAY_WEBHOOK_SECRET to match.
"""

from fastapi import APIRouter, Depends, Header, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BookingStatus, Payment
from app.services import razorpay_client
from app.services.whatsapp import notify_booking_created

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
    db: Session = Depends(get_db),
) -> JSONResponse:
    raw_body = await request.body()
    if not razorpay_client.verify_webhook_signature(raw_body, x_razorpay_signature):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": "Invalid signature"})

    event = await request.json()
    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    if not order_id:
        return JSONResponse(content={"status": "ignored"})

    payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
    if payment and payment.status != "paid":
        payment.status = "paid"
        payment.provider_reference = payment_id
        booking = payment.booking
        booking.status = (
            BookingStatus.confirmed if booking.ride.auto_confirm_bookings else BookingStatus.pending
        )
        notify_booking_created(db, booking)
        db.commit()

    return JSONResponse(content={"status": "ok"})
