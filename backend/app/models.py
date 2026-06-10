import enum
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class RideStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    cancelled = "cancelled"
    completed = "completed"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"


class NotificationStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    mocked = "mocked"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    age: Mapped[int | None] = mapped_column(Integer)
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    whatsapp_number: Mapped[str | None] = mapped_column(String(20))
    emergency_contact: Mapped[str | None] = mapped_column(String(20))
    personal_car_brand: Mapped[str | None] = mapped_column(String(80))
    personal_car_model: Mapped[str | None] = mapped_column(String(80))
    personal_car_number: Mapped[str | None] = mapped_column(String(30))
    personal_car_fuel_type: Mapped[str | None] = mapped_column(String(30))
    personal_car_category: Mapped[str | None] = mapped_column(String(40))
    personal_car_seats: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.pending)
    rating_average: Mapped[float] = mapped_column(Float, default=0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    driver_profile: Mapped["DriverProfile"] = relationship(back_populates="user", uselist=False)
    passenger_profile: Mapped["PassengerProfile"] = relationship(back_populates="user", uselist=False)
    aadhaar_verification: Mapped["AadhaarVerification"] = relationship(back_populates="user", uselist=False, foreign_keys="AadhaarVerification.user_id")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="driver")
    rides: Mapped[list["Ride"]] = relationship(back_populates="driver")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="passenger")


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(60))
    driving_license_photo_url: Mapped[str | None] = mapped_column(String(255))
    bio: Mapped[str | None] = mapped_column(Text)
    auto_confirm_bookings: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_trips: Mapped[int] = mapped_column(Integer, default=0)
    total_earnings: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="driver_profile")


class PassengerProfile(Base):
    __tablename__ = "passenger_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    preferred_pickup_point: Mapped[str | None] = mapped_column(String(120))
    preferred_drop_point: Mapped[str | None] = mapped_column(String(120))
    women_only_preference: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="passenger_profile")


class AadhaarVerification(Base):
    __tablename__ = "aadhaar_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    aadhaar_token: Mapped[str] = mapped_column(String(128), index=True)
    encrypted_aadhaar: Mapped[str] = mapped_column(Text)
    masked_aadhaar: Mapped[str] = mapped_column(String(20))
    status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.pending)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    reviewed_by_admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="aadhaar_verification", foreign_keys=[user_id])


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    brand: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(80))
    vehicle_number: Mapped[str] = mapped_column(String(30), unique=True)
    fuel_type: Mapped[str] = mapped_column(String(30))
    car_type: Mapped[str] = mapped_column(String(40), default="Sedan")
    seats: Mapped[int] = mapped_column(Integer)
    photo_urls: Mapped[str] = mapped_column(Text, default="")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    driver: Mapped[User] = relationship(back_populates="vehicles")
    rides: Mapped[list["Ride"]] = relationship(back_populates="vehicle")


class Ride(Base):
    __tablename__ = "rides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"))
    source_city: Mapped[str] = mapped_column(String(80), index=True)
    destination_city: Mapped[str] = mapped_column(String(80), index=True)
    route_key: Mapped[str] = mapped_column(String(180), index=True)
    distance_km: Mapped[int] = mapped_column(Integer)
    journey_date: Mapped[date] = mapped_column(Date, index=True)
    departure_time: Mapped[time] = mapped_column(Time)
    available_seats: Mapped[int] = mapped_column(Integer)
    total_seats: Mapped[int] = mapped_column(Integer)
    price_per_seat: Mapped[int] = mapped_column(Integer)
    route_notes: Mapped[str | None] = mapped_column(Text)
    luggage_allowance: Mapped[str | None] = mapped_column(String(120))
    smoking_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    ac_available: Mapped[bool] = mapped_column(Boolean, default=True)
    women_only_preference: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_confirm_bookings: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[RideStatus] = mapped_column(Enum(RideStatus), default=RideStatus.active)
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    driver: Mapped[User] = relationship(back_populates="rides")
    vehicle: Mapped[Vehicle] = relationship(back_populates="rides")
    pickup_points: Mapped[list["RidePickupPoint"]] = relationship(back_populates="ride", cascade="all, delete-orphan")
    drop_points: Mapped[list["RideDropPoint"]] = relationship(back_populates="ride", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="ride")


class RidePickupPoint(Base):
    __tablename__ = "ride_pickup_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ride_id: Mapped[int] = mapped_column(ForeignKey("rides.id"))
    name: Mapped[str] = mapped_column(String(120))

    ride: Mapped[Ride] = relationship(back_populates="pickup_points")


class RideDropPoint(Base):
    __tablename__ = "ride_drop_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ride_id: Mapped[int] = mapped_column(ForeignKey("rides.id"))
    name: Mapped[str] = mapped_column(String(120))

    ride: Mapped[Ride] = relationship(back_populates="drop_points")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("ride_id", "passenger_id", "pickup_point", "drop_point", name="uq_booking_route_passenger_point"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    ride_id: Mapped[int] = mapped_column(ForeignKey("rides.id"), index=True)
    passenger_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    seats_booked: Mapped[int] = mapped_column(Integer)
    pickup_point: Mapped[str] = mapped_column(String(120))
    drop_point: Mapped[str] = mapped_column(String(120))
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.pending)
    total_amount: Mapped[int] = mapped_column(Integer)
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ride: Mapped[Ride] = relationship(back_populates="bookings")
    passenger: Mapped[User] = relationship(back_populates="bookings")
    payment: Mapped["Payment"] = relationship(back_populates="booking", uselist=False)

    @property
    def driver_id(self) -> int:
        return self.ride.driver_id

    @property
    def driver_name(self) -> str:
        return self.ride.driver.full_name

    @property
    def route(self) -> str:
        return f"{self.ride.source_city} to {self.ride.destination_city}"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True)
    amount: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(40), default="not_required_mvp")
    provider_reference: Mapped[str | None] = mapped_column(String(120))

    booking: Mapped[Booking] = relationship(back_populates="payment")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reviewee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id"))
    channel: Mapped[str] = mapped_column(String(40), default="whatsapp")
    template_name: Mapped[str] = mapped_column(String(80))
    recipient: Mapped[str] = mapped_column(String(40))
    payload: Mapped[str] = mapped_column(Text)
    status: Mapped[NotificationStatus] = mapped_column(Enum(NotificationStatus), default=NotificationStatus.mocked)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    permissions: Mapped[str] = mapped_column(Text, default="users,rides,bookings,verification,reports")


class ReportedUser(Base):
    __tablename__ = "reported_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reported_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ride_id: Mapped[int | None] = mapped_column(ForeignKey("rides.id"))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CancellationReason(Base):
    __tablename__ = "cancellation_reasons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ride_id: Mapped[int | None] = mapped_column(ForeignKey("rides.id"))
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id"))
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
