"""Admin moderation and read-model logic."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models import AadhaarVerification, Booking, ReportedUser, Ride, User, VerificationStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.ride_repository import RideRepository
from app.repositories.user_repository import UserRepository


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.rides = RideRepository(db)
        self.bookings = BookingRepository(db)

    def _require_user(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def _aadhaar_for(self, user_id: int) -> AadhaarVerification | None:
        return self.db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user_id).first()

    def verify_user(self, user_id: int, admin_id: int) -> User:
        user = self._require_user(user_id)
        user.verification_status = VerificationStatus.verified
        aadhaar = self._aadhaar_for(user.id)
        if aadhaar:
            aadhaar.status = VerificationStatus.verified
            aadhaar.reviewed_at = datetime.utcnow()
            aadhaar.reviewed_by_admin_id = admin_id
        self.db.commit()
        self.db.refresh(user)
        return user

    def reject_user(self, user_id: int, admin_id: int, reason: str | None) -> User:
        user = self._require_user(user_id)
        user.verification_status = VerificationStatus.rejected
        aadhaar = self._aadhaar_for(user.id)
        if aadhaar:
            aadhaar.status = VerificationStatus.rejected
            aadhaar.reviewed_at = datetime.utcnow()
            aadhaar.reviewed_by_admin_id = admin_id
            aadhaar.rejection_reason = reason
        self.db.commit()
        self.db.refresh(user)
        return user

    def block_user(self, user_id: int, admin_id: int) -> User:
        user = self._require_user(user_id)
        if user.id == admin_id:
            raise ValidationError("Admin cannot block self")
        user.is_blocked = True
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_users(self) -> list[User]:
        return self.users.list_newest_first()

    def list_rides(self) -> list[dict]:
        return [
            {
                "id": ride.id,
                "route": f"{ride.source_city} to {ride.destination_city}",
                "date": ride.journey_date.isoformat(),
                "driver": ride.driver.full_name,
                "available_seats": ride.available_seats,
                "status": ride.status,
            }
            for ride in self.rides.list_newest_first()
        ]

    def list_bookings(self) -> list[dict]:
        return [
            {
                "id": booking.id,
                "booking_code": booking.booking_code,
                "route": f"{booking.ride.source_city} to {booking.ride.destination_city}",
                "passenger": booking.passenger.full_name,
                "seats": booking.seats_booked,
                "status": booking.status,
            }
            for booking in self.bookings.list_newest_first()
        ]

    def list_reports(self) -> list[dict]:
        return [
            {
                "id": report.id,
                "reporter_id": report.reporter_id,
                "reported_user_id": report.reported_user_id,
                "reason": report.reason,
                "status": report.status,
            }
            for report in self.db.query(ReportedUser).order_by(ReportedUser.created_at.desc()).all()
        ]
