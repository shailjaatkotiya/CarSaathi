"""Pydantic schemas, grouped by domain.

Re-exported here so callers keep using ``from app.schemas import X`` while the
definitions live in cohesive per-domain modules (auth, user, vehicle, ride,
booking, payment, moderation).
"""

from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.booking import (
    BookingActionOut,
    BookingCreate,
    BookingOut,
    CancellationRequest,
    DriverBookingOut,
    PassengerInput,
    PassengerOut,
)
from app.schemas.moderation import AdminDecision, ReportCreate, ReviewCreate
from app.schemas.passenger import SavedPassengerCreate, SavedPassengerOut
from app.schemas.payment import PaymentInitOut, PaymentVerifyRequest
from app.schemas.ride import FellowPassengerOut, RideCreate, RideOut
from app.schemas.user import (
    AadhaarUploadRequest,
    ProfileUpdate,
    UserOut,
    VerificationOut,
)
from app.schemas.vehicle import VehicleCreate, VehicleOut

__all__ = [
    "AadhaarUploadRequest",
    "AdminDecision",
    "BookingActionOut",
    "BookingCreate",
    "BookingOut",
    "CancellationRequest",
    "DriverBookingOut",
    "FellowPassengerOut",
    "LoginRequest",
    "PassengerInput",
    "PassengerOut",
    "PaymentInitOut",
    "PaymentVerifyRequest",
    "ProfileUpdate",
    "RegisterRequest",
    "ReportCreate",
    "ReviewCreate",
    "RideCreate",
    "RideOut",
    "SavedPassengerCreate",
    "SavedPassengerOut",
    "TokenResponse",
    "UserOut",
    "VehicleCreate",
    "VehicleOut",
]
