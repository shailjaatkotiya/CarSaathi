from datetime import date, time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core import cache
from app.database import get_db
from app.dependencies import require_passenger
from app.models import Booking, BookingStatus, CancellationReason, Review, Ride, RideStatus, User
from app.schemas import BookingCreate, BookingOut, CancellationRequest, ReportCreate, ReviewCreate, RideOut
from app.services.whatsapp import notify_booking_cancelled, notify_booking_created
from app.utils.serializers import ride_to_out

router = APIRouter(prefix="/passenger", tags=["passenger"])


def cap_available_seats(ride: Ride) -> None:
    ride.available_seats = min(ride.available_seats, ride.total_seats)


@router.get("/rides/search", response_model=list[RideOut])
def search_rides(
    source: str | None = None,
    destination: str | None = None,
    journey_date: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    seats: int = 1,
    departure_after: str | None = None,
    departure_before: str | None = None,
    pickup_point: str | None = None,
    drop_point: str | None = None,
    source_area: str | None = None,
    destination_area: str | None = None,
    driver_rating: float | None = None,
    car_type: str | None = None,
    fuel_type: str | None = None,
    sort_by: str = "date_time",
    ac_available: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[RideOut]:
    search_params = {
        "source": source,
        "destination": destination,
        "journey_date": journey_date,
        "min_price": min_price,
        "max_price": max_price,
        "seats": seats,
        "departure_after": departure_after,
        "departure_before": departure_before,
        "pickup_point": pickup_point,
        "drop_point": drop_point,
        "source_area": source_area,
        "destination_area": destination_area,
        "driver_rating": driver_rating,
        "car_type": car_type,
        "fuel_type": fuel_type,
        "sort_by": sort_by,
        "ac_available": ac_available,
    }
    cached = cache.get_cached_ride_search(search_params)
    if cached is not None:
        return cached

    query = db.query(Ride).filter(Ride.status == RideStatus.active, Ride.available_seats >= seats)
    if source:
        query = query.filter(Ride.source_city.ilike(f"%{source}%"))
    if destination:
        query = query.filter(Ride.destination_city.ilike(f"%{destination}%"))
    if journey_date:
        query = query.filter(Ride.journey_date == date.fromisoformat(journey_date))
    if min_price is not None:
        query = query.filter(Ride.price_per_seat >= min_price)
    if max_price is not None:
        query = query.filter(Ride.price_per_seat <= max_price)
    if departure_after:
        query = query.filter(Ride.departure_time >= time.fromisoformat(departure_after))
    if departure_before:
        query = query.filter(Ride.departure_time <= time.fromisoformat(departure_before))
    if ac_available is not None:
        query = query.filter(Ride.ac_available == ac_available)
    rides = query.order_by(Ride.journey_date.asc(), Ride.departure_time.asc()).all()
    results = []
    for ride in rides:
        output = ride_to_out(ride)
        pickup_names = [point.lower() for point in output.pickup_points]
        drop_names = [point.lower() for point in output.drop_points]
        stop_names = [point.lower() for point in output.route_stops]
        if pickup_point and pickup_point.lower() not in pickup_names:
            continue
        if drop_point and drop_point.lower() not in drop_names:
            continue
        if source_area and source_area.lower() not in pickup_names:
            continue
        if destination_area and destination_area.lower() not in drop_names and destination_area.lower() not in stop_names:
            continue
        if driver_rating is not None and ride.driver.rating_average < driver_rating:
            continue
        if car_type and ride.vehicle.car_type.lower() != car_type.lower():
            continue
        if fuel_type and ride.vehicle.fuel_type.lower() != fuel_type.lower():
            continue
        results.append(output)
    if sort_by == "time":
        results = sorted(results, key=lambda item: (item.departure_time, item.journey_date))
    elif sort_by == "price":
        results = sorted(results, key=lambda item: item.price_per_seat)
    else:
        results = sorted(results, key=lambda item: (item.journey_date, item.departure_time))
    cache.set_cached_ride_search(search_params, [ride.model_dump(mode="json") for ride in results])
    return results


@router.get("/rides/{ride_id}", response_model=RideOut)
def ride_detail(ride_id: int, db: Session = Depends(get_db)) -> RideOut:
    ride = db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    return ride_to_out(ride)


@router.post("/rides/{ride_id}/book", response_model=BookingOut)
def book_ride(ride_id: int, payload: BookingCreate, passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> Booking:
    if not (passenger.whatsapp_number and passenger.whatsapp_number.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add your WhatsApp contact number in My Profile before booking a ride",
        )
    ride = db.query(Ride).filter(Ride.id == ride_id).with_for_update().first()
    if not ride or ride.status != RideStatus.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not available")
    if ride.driver_id == passenger.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver cannot book own ride")
    if payload.seats_booked > ride.available_seats:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Not enough seats available")
    ride_output = ride_to_out(ride)
    valid_pickups = ride_output.pickup_points
    valid_drops = ride_output.drop_points + ride_output.route_stops
    if payload.pickup_point not in valid_pickups or payload.drop_point not in valid_drops:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pickup or drop point")

    status_value = BookingStatus.confirmed if ride.auto_confirm_bookings else BookingStatus.pending
    ride.available_seats -= payload.seats_booked
    booking = Booking(
        booking_code=f"RS-{uuid4().hex[:8].upper()}",
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=payload.seats_booked,
        pickup_point=payload.pickup_point,
        drop_point=payload.drop_point,
        status=status_value,
        total_amount=payload.seats_booked * ride.price_per_seat,
    )
    db.add(booking)
    db.flush()
    notify_booking_created(db, booking)
    db.commit()
    db.refresh(booking)
    cache.bump_rides_version()
    return booking


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, payload: CancellationRequest, passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.passenger_id == passenger.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status in {BookingStatus.pending, BookingStatus.confirmed}:
        booking.ride.available_seats += booking.seats_booked
        cap_available_seats(booking.ride)
    booking.status = BookingStatus.cancelled
    booking.cancellation_reason = payload.reason
    db.add(CancellationReason(user_id=passenger.id, booking_id=booking.id, reason=payload.reason))
    notify_booking_cancelled(db, booking, payload.reason, "passenger")
    db.commit()
    db.refresh(booking)
    cache.bump_rides_version()
    return booking


@router.get("/bookings", response_model=list[BookingOut])
def booking_history(passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> list[Booking]:
    return (
        db.query(Booking)
        .filter(Booking.passenger_id == passenger.id, Booking.status != BookingStatus.completed)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.post("/bookings/{booking_id}/review")
def rate_driver(booking_id: int, payload: ReviewCreate, passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.passenger_id == passenger.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    review = Review(booking_id=booking.id, reviewer_id=passenger.id, reviewee_id=booking.ride.driver_id, rating=payload.rating, comment=payload.comment)
    db.add(review)
    driver = booking.ride.driver
    total = driver.rating_average * driver.rating_count + payload.rating
    driver.rating_count += 1
    driver.rating_average = round(total / driver.rating_count, 2)
    db.commit()
    return {"message": "Review submitted"}


@router.post("/reports")
def report_user(payload: ReportCreate, reporter: User = Depends(require_passenger), db: Session = Depends(get_db)) -> dict:
    from app.models import ReportedUser

    db.add(ReportedUser(reporter_id=reporter.id, reported_user_id=payload.reported_user_id, ride_id=payload.ride_id, reason=payload.reason))
    db.commit()
    return {"message": "Report submitted for admin review"}
