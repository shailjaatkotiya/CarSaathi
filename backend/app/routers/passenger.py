from datetime import date, time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core import cache
from app.core.config import get_settings
from app.database import get_db
from app.dependencies import require_passenger
from app.models import Booking, BookingStatus, CancellationReason, Payment, Ride, RideStatus, User
from app.schemas import (
    BookingActionOut,
    BookingCreate,
    BookingOut,
    CancellationRequest,
    FellowPassengerOut,
    PaymentInitOut,
    PaymentVerifyRequest,
    ReportCreate,
    RideOut,
)
from app.services import razorpay_client
from app.services.whatsapp import notify_booking_cancelled, notify_booking_created
from app.utils.serializers import ride_to_out

settings = get_settings()

router = APIRouter(prefix="/passenger", tags=["passenger"])

DEPARTURE_WINDOWS = {
    "before_0600": (time.min, time(5, 59, 59)),
    "morning": (time(6, 0), time(12, 0)),
    "afternoon": (time(12, 1), time(18, 0)),
    "after_1800": (time(18, 0, 1), time.max),
}

SORT_ALIASES = {
    "date_time": "earliest_departure",
    "time": "earliest_departure",
    "price": "lowest_price",
}


def cap_available_seats(ride: Ride) -> None:
    ride.available_seats = min(ride.available_seats, ride.total_seats)


def parse_csv_filter(value: str | None) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def normalize_sort(sort_by: str) -> str:
    normalized = sort_by.strip().lower()
    return SORT_ALIASES.get(normalized, normalized)


def matches_departure_window(departure_time: time, selected_windows: set[str]) -> bool:
    if not selected_windows:
        return True
    return any(
        start <= departure_time <= end
        for key, (start, end) in DEPARTURE_WINDOWS.items()
        if key in selected_windows
    )


def text_match_rank(query: str | None, values: list[str]) -> int:
    if not query:
        return 0
    needle = query.strip().lower()
    haystack = [value.strip().lower() for value in values if value.strip()]
    if any(value == needle for value in haystack):
        return 0
    if any(value.startswith(needle) or needle.startswith(value) for value in haystack):
        return 1
    if any(needle in value or value in needle for value in haystack):
        return 2
    return 3


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
    departure_window: str | None = None,
    sort_by: str = "date_time",
    ac_available: bool | None = Query(default=None),
    verified_profile: bool | None = Query(default=None),
    instant_booking: bool | None = Query(default=None),
    smoking_allowed: bool | None = Query(default=None),
    pets_allowed: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[RideOut]:
    selected_departure_windows = parse_csv_filter(departure_window)
    normalized_sort = normalize_sort(sort_by)
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
        "departure_window": sorted(selected_departure_windows),
        "sort_by": normalized_sort,
        "ac_available": ac_available,
        "verified_profile": verified_profile,
        "instant_booking": instant_booking,
        "smoking_allowed": smoking_allowed,
        "pets_allowed": pets_allowed,
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
        if not matches_departure_window(output.departure_time, selected_departure_windows):
            continue
        if verified_profile is not None and output.driver_verified != verified_profile:
            continue
        if instant_booking is not None and output.auto_confirm_bookings != instant_booking:
            continue
        if smoking_allowed is not None and output.smoking_allowed != smoking_allowed:
            continue
        if pets_allowed is not None and ("no_pets" not in output.ride_rules) != pets_allowed:
            continue
        results.append(output)
    if normalized_sort == "lowest_price":
        results = sorted(results, key=lambda item: item.price_per_seat)
    elif normalized_sort == "close_to_departure_point":
        departure_query = source_area or pickup_point or source
        results = sorted(
            results,
            key=lambda item: (
                text_match_rank(departure_query, item.pickup_points + [item.source_city]),
                item.journey_date,
                item.departure_time,
                item.price_per_seat,
            ),
        )
    elif normalized_sort == "close_to_arrival_point":
        arrival_query = destination_area or drop_point or destination
        results = sorted(
            results,
            key=lambda item: (
                text_match_rank(arrival_query, item.drop_points + item.route_stops + [item.destination_city]),
                item.journey_date,
                item.departure_time,
                item.price_per_seat,
            ),
        )
    elif normalized_sort == "shortest_ride":
        results = sorted(results, key=lambda item: (item.distance_km, item.journey_date, item.departure_time))
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


@router.get("/rides/{ride_id}/passengers", response_model=list[FellowPassengerOut])
def ride_passengers(ride_id: int, db: Session = Depends(get_db)) -> list[FellowPassengerOut]:
    ride = db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    return [
        FellowPassengerOut(
            name=b.passenger.full_name,
            pickup_point=b.pickup_point,
            drop_point=b.drop_point,
            seats_booked=b.seats_booked,
        )
        for b in ride.bookings
        if b.status in (BookingStatus.confirmed, BookingStatus.pending)
    ]


@router.post("/rides/{ride_id}/book", response_model=BookingActionOut)
def book_ride(ride_id: int, payload: BookingCreate, passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> BookingActionOut:
    if not (passenger.whatsapp_number and passenger.whatsapp_number.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add your WhatsApp contact number in My Profile before booking a ride",
        )
    if payload.payment_method == "online" and not razorpay_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Online payment is not available right now. Please choose Pay by cash.",
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

    total_amount = payload.seats_booked * ride.price_per_seat
    ride.available_seats -= payload.seats_booked

    if payload.payment_method == "online":
        # Reserve seats but keep the booking unconfirmed until payment succeeds.
        # The driver is notified only after the money is verified (see verify_payment).
        booking_status = BookingStatus.pending
        payment = Payment(method="online", status="created", amount=total_amount)
    else:
        booking_status = BookingStatus.confirmed if ride.auto_confirm_bookings else BookingStatus.pending
        payment = Payment(method="cash", status="pending_cash", amount=total_amount)

    booking = Booking(
        booking_code=f"RS-{uuid4().hex[:8].upper()}",
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=payload.seats_booked,
        pickup_point=payload.pickup_point,
        drop_point=payload.drop_point,
        status=booking_status,
        total_amount=total_amount,
        payment_method=payload.payment_method,
    )
    booking.payment = payment
    db.add(booking)
    db.flush()

    payment_init: PaymentInitOut | None = None
    if payload.payment_method == "online":
        try:
            order = razorpay_client.create_order(total_amount, receipt=booking.booking_code)
        except Exception as exc:  # noqa: BLE001 - surface a clean error, roll back the reservation
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not start the payment. Please try again.",
            ) from exc
        payment.razorpay_order_id = order["id"]
        payment_init = PaymentInitOut(
            razorpay_order_id=order["id"],
            razorpay_key_id=settings.razorpay_key_id,
            amount=order["amount"],
            currency=order["currency"],
            booking_code=booking.booking_code,
        )
    else:
        # Cash: keep the existing flow - notify the driver right away.
        notify_booking_created(db, booking)

    db.commit()
    db.refresh(booking)
    cache.bump_rides_version()
    return BookingActionOut(booking=BookingOut.model_validate(booking), payment=payment_init)


@router.post("/payments/verify", response_model=BookingOut)
def verify_payment(payload: PaymentVerifyRequest, passenger: User = Depends(require_passenger), db: Session = Depends(get_db)) -> Booking:
    booking = db.query(Booking).filter(Booking.id == payload.booking_id, Booking.passenger_id == passenger.id).first()
    if not booking or not booking.payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    payment = booking.payment
    if payment.method != "online" or payment.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment does not match this booking")
    if payment.status == "paid":
        return booking  # idempotent: already confirmed (e.g. webhook arrived first)
    if not razorpay_client.verify_payment_signature(
        payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")

    payment.status = "paid"
    payment.provider_reference = payload.razorpay_payment_id
    booking.status = BookingStatus.confirmed if booking.ride.auto_confirm_bookings else BookingStatus.pending
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
    # Passengers may cancel only after the driver has approved (confirmed) the booking.
    if booking.status != BookingStatus.confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can cancel a ride only after the driver approves your booking",
        )
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


@router.post("/reports")
def report_user(payload: ReportCreate, reporter: User = Depends(require_passenger), db: Session = Depends(get_db)) -> dict:
    from app.models import ReportedUser

    db.add(ReportedUser(reporter_id=reporter.id, reported_user_id=payload.reported_user_id, ride_id=payload.ride_id, reason=payload.reason))
    db.commit()
    return {"message": "Report submitted for admin review"}
