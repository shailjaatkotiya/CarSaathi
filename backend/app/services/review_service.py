from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import Booking, BookingStatus, Review, User, UserRole
from app.schemas import DriverProfileOut, ReviewCreate, ReviewOut
from app.services.ride_time import auto_complete_if_passed


class ReviewService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_for_booking(
        self, booking_id: int, passenger: User, payload: ReviewCreate
    ) -> Review:
        booking = (
            self.db.query(Booking)
            .filter(Booking.id == booking_id, Booking.passenger_id == passenger.id)
            .first()
        )
        if not booking:
            raise NotFoundError("Booking not found")
        auto_complete_if_passed(booking.ride)
        if booking.status != BookingStatus.completed:
            raise ValidationError("You can review the driver only after the ride is completed")
        if booking.review:
            raise ConflictError("You have already reviewed this ride")

        review = Review(
            booking_id=booking.id,
            reviewer_id=passenger.id,
            reviewee_id=booking.driver_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        self.db.add(review)
        self.db.flush()
        self._refresh_driver_rating(booking.driver_id)
        self.db.commit()
        self.db.refresh(review)
        return review

    def driver_profile(self, driver_id: int) -> DriverProfileOut:
        driver = self.db.get(User, driver_id)
        if not driver or driver.role != UserRole.driver:
            raise NotFoundError("Driver not found")
        return DriverProfileOut(
            id=driver.id,
            full_name=driver.full_name,
            rating_average=driver.rating_average or 0,
            rating_count=driver.rating_count or 0,
            reviews=[
                self._review_out(review)
                for review in (
                    self.db.query(Review)
                    .filter(Review.reviewee_id == driver.id)
                    .order_by(Review.created_at.desc(), Review.id.desc())
                    .all()
                )
            ],
        )

    def _refresh_driver_rating(self, driver_id: int) -> None:
        rating_average, rating_count = (
            self.db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.reviewee_id == driver_id)
            .one()
        )
        driver = self.db.get(User, driver_id)
        if driver:
            driver.rating_average = round(float(rating_average or 0), 1)
            driver.rating_count = int(rating_count or 0)

    @staticmethod
    def _review_out(review: Review) -> ReviewOut:
        return ReviewOut(
            id=review.id,
            booking_id=review.booking_id,
            rating=review.rating,
            comment=review.comment,
            reviewer_name=review.reviewer.full_name,
            route=review.booking.route,
            created_at=review.created_at,
        )
