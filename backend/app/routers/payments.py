"""Public Razorpay webhook endpoint (no auth - Razorpay calls it directly).

This is the trustworthy server-to-server confirmation. The browser callback
(/passenger/payments/verify) is the fast path; this webhook is the backstop so a
booking still gets confirmed if the user closes the tab mid-payment. Both paths
are idempotent - whichever lands first marks the payment paid, the other no-ops.

Configure the URL (https://<your-domain>/api/v1/payments/webhook) and the secret
in the Razorpay dashboard, and set RAZORPAY_WEBHOOK_SECRET to match.
"""

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
    db: Session = Depends(get_db),
) -> JSONResponse:
    raw_body = await request.body()
    event = await request.json()
    result = PaymentService(db).handle_razorpay_webhook(
        raw_body, x_razorpay_signature, event
    )
    return JSONResponse(content={"status": result})
