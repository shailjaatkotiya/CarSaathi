from pydantic import BaseModel, Field


class PaymentInitOut(BaseModel):
    """Razorpay order details returned to the browser to open Checkout."""

    razorpay_order_id: str
    razorpay_key_id: str
    amount: int  # in paise
    currency: str
    booking_code: str


class PaymentVerifyRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)
