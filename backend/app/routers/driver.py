from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_current_user, require_driver
from app.models import Booking, BookingStatus, CancellationReason, Ride, RideDropPoint, RidePickupPoint, RideStatus, User, UserRole, Vehicle
from app.schemas import BookingOut, CancellationRequest, RideCreate, RideOut, VehicleCreate, VehicleOut
from app.services.whatsapp import notify_booking_created, notify_ride_cancelled
from app.utils.serializers import ride_to_out

router = APIRouter(prefix="/driver", tags=["driver"])


def resolve_demo_driver(db: Session, user: User | None) -> User:
    if user and user.role in {UserRole.driver, UserRole.admin}:
        return user
    demo_driver = db.query(User).filter(User.role == UserRole.driver, User.email == "driver@ridesaathi.in").first()
    if not demo_driver:
        demo_driver = db.query(User).filter(User.role == UserRole.driver).first()
    if not demo_driver:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Demo driver is not available")
    return demo_driver


def build_route_notes(notes: str | None, route_stops: list[str], ride_rules: list[str], driver_instructions: str | None) -> str | None:
    parts = [notes.strip()] if notes and notes.strip() else []
    if route_stops:
        parts.append(f"[route_stops]{'|'.join(route_stops)}[/route_stops]")
    if ride_rules:
        parts.append(f"[ride_rules]{'|'.join(ride_rules)}[/ride_rules]")
    if driver_instructions and driver_instructions.strip():
        parts.append(f"[driver_instructions]{driver_instructions.strip()}[/driver_instructions]")
    return "\n\n".join(parts) if parts else None


def validate_publish_window(payload: RideCreate) -> None:
    journey_at = datetime.combine(payload.journey_date, payload.departure_time)
    now = datetime.now()
    if journey_at < now + timedelta(hours=3):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ride must be published at least 3 hours before departure")
    if journey_at > now + timedelta(days=10):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ride can be published maximum 10 days before departure")


def validate_route_frequency(db: Session, driver: User, route_key: str, payload: RideCreate) -> None:
    day_count = (
        db.query(Ride)
        .filter(
            Ride.driver_id == driver.id,
            Ride.route_key == route_key,
            Ride.journey_date == payload.journey_date,
            Ride.status != RideStatus.cancelled,
        )
        .count()
    )
    if day_count >= 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum 2 rides per day are allowed for the same route")

    week_start = payload.journey_date - timedelta(days=payload.journey_date.weekday())
    week_end = week_start + timedelta(days=7)
    week_count = (
        db.query(Ride)
        .filter(
            Ride.driver_id == driver.id,
            Ride.route_key == route_key,
            Ride.journey_date >= week_start,
            Ride.journey_date < week_end,
            Ride.status != RideStatus.cancelled,
        )
        .count()
    )
    if week_count >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum 5 rides per week are allowed for the same route")


def validate_stop_counts(payload: RideCreate) -> None:
    if len(payload.pickup_points) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please add minimum 5 pickup points")
    if len(payload.drop_points) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please add minimum 5 drop points")


def apply_vehicle_details(vehicle: Vehicle, payload: RideCreate) -> None:
    if payload.car_brand:
        vehicle.brand = payload.car_brand
    if payload.car_model:
        vehicle.model = payload.car_model
    if payload.vehicle_number:
        vehicle.vehicle_number = payload.vehicle_number.upper()
    if payload.fuel_type:
        vehicle.fuel_type = payload.fuel_type
    if payload.car_type:
        vehicle.car_type = payload.car_type


@router.post("/vehicles", response_model=VehicleOut)
def add_vehicle(payload: VehicleCreate, driver: User = Depends(require_driver), db: Session = Depends(get_db)) -> Vehicle:
    vehicle = Vehicle(
        driver_id=driver.id,
        brand=payload.brand,
        model=payload.model,
        vehicle_number=payload.vehicle_number.upper(),
        fuel_type=payload.fuel_type,
        car_type=payload.car_type,
        seats=payload.seats,
        photo_urls=",".join(payload.photo_urls),
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(driver: User = Depends(require_driver), db: Session = Depends(get_db)) -> list[Vehicle]:
    return db.query(Vehicle).filter(Vehicle.driver_id == driver.id).all()


@router.put("/vehicles/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, payload: VehicleCreate, driver: User = Depends(require_driver), db: Session = Depends(get_db)) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.driver_id == driver.id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    for field in ["brand", "model", "fuel_type", "car_type", "seats"]:
        setattr(vehicle, field, getattr(payload, field))
    vehicle.vehicle_number = payload.vehicle_number.upper()
    vehicle.photo_urls = ",".join(payload.photo_urls)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.post("/rides", response_model=RideOut)
def create_ride(payload: RideCreate, current_user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> RideOut:
    driver = resolve_demo_driver(db, current_user)
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id, Vehicle.driver_id == driver.id).first()
    if not vehicle and current_user is None:
        vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    validate_stop_counts(payload)
    apply_vehicle_details(vehicle, payload)
    if payload.available_seats > vehicle.seats:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Available seats exceed vehicle capacity")
    validate_publish_window(payload)
    route_key = f"{payload.source_city.lower()}:{payload.destination_city.lower()}"
    validate_route_frequency(db, driver, route_key, payload)
    ride = Ride(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        source_city=payload.source_city,
        destination_city=payload.destination_city,
        route_key=route_key,
        distance_km=payload.distance_km,
        journey_date=payload.journey_date,
        departure_time=payload.departure_time,
        available_seats=payload.available_seats,
        total_seats=payload.available_seats,
        price_per_seat=payload.price_per_seat,
        route_notes=build_route_notes(payload.route_notes, payload.route_stops, payload.ride_rules, payload.driver_instructions),
        luggage_allowance=payload.luggage_allowance,
        smoking_allowed=payload.smoking_allowed,
        ac_available=payload.ac_available,
        women_only_preference=payload.women_only_preference,
        auto_confirm_bookings=payload.auto_confirm_bookings,
    )
    db.add(ride)
    db.flush()
    db.add_all([RidePickupPoint(ride_id=ride.id, name=name) for name in payload.pickup_points])
    db.add_all([RideDropPoint(ride_id=ride.id, name=name) for name in payload.drop_points])
    db.commit()
    db.refresh(ride)
    return ride_to_out(ride)


@router.get("/rides", response_model=list[RideOut])
def my_rides(current_user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> list[RideOut]:
    driver = resolve_demo_driver(db, current_user)
    rides = db.query(Ride).filter(Ride.driver_id == driver.id).order_by(Ride.journey_date.desc()).all()
    return [ride_to_out(ride) for ride in rides]


@router.post("/rides/{ride_id}/cancel")
def cancel_ride(ride_id: int, payload: CancellationRequest, current_user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> dict:
    driver = resolve_demo_driver(db, current_user)
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == driver.id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    # Notify while bookings are still pending/confirmed; notify_ride_cancelled
    # skips bookings already marked cancelled.
    notify_ride_cancelled(db, ride, payload.reason)
    ride.status = RideStatus.cancelled
    ride.cancellation_reason = payload.reason
    for booking in ride.bookings:
        if booking.status in {BookingStatus.pending, BookingStatus.confirmed}:
            booking.status = BookingStatus.cancelled
            booking.cancellation_reason = f"Driver cancelled ride: {payload.reason}"
    db.add(CancellationReason(user_id=driver.id, ride_id=ride.id, reason=payload.reason))
    db.commit()
    return {"message": "Ride cancelled"}


@router.get("/rides/{ride_id}/bookings", response_model=list[BookingOut])
def ride_bookings(ride_id: int, current_user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> list[Booking]:
    driver = resolve_demo_driver(db, current_user)
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == driver.id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    return ride.bookings


@router.get("/bookings/active")
def active_driver_bookings(current_user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> list[dict]:
    driver = resolve_demo_driver(db, current_user)
    bookings = (
        db.query(Booking)
        .join(Ride)
        .filter(Ride.driver_id == driver.id, Booking.status != BookingStatus.completed)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [
        {
            "id": booking.id,
            "booking_code": booking.booking_code,
            "status": booking.status,
            "seats_booked": booking.seats_booked,
            "pickup_point": booking.pickup_point,
            "drop_point": booking.drop_point,
            "total_amount": booking.total_amount,
            "passenger_name": booking.passenger.full_name,
            "passenger_whatsapp": booking.passenger.whatsapp_number,
            "route": f"{booking.ride.source_city} to {booking.ride.destination_city}",
            "journey_date": booking.ride.journey_date.isoformat(),
            "departure_time": booking.ride.departure_time.isoformat(),
        }
        for booking in bookings
    ]


@router.post("/bookings/{booking_id}/accept", response_model=BookingOut)
def accept_booking(booking_id: int, driver: User = Depends(require_driver), db: Session = Depends(get_db)) -> Booking:
    booking = db.query(Booking).join(Ride).filter(Booking.id == booking_id, Ride.driver_id == driver.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    booking.status = BookingStatus.confirmed
    notify_booking_created(db, booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/bookings/{booking_id}/reject", response_model=BookingOut)
def reject_booking(booking_id: int, driver: User = Depends(require_driver), db: Session = Depends(get_db)) -> Booking:
    booking = db.query(Booking).join(Ride).filter(Booking.id == booking_id, Ride.driver_id == driver.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status in {BookingStatus.pending, BookingStatus.confirmed}:
        booking.ride.available_seats += booking.seats_booked
    booking.status = BookingStatus.rejected
    db.commit()
    db.refresh(booking)
    return booking
