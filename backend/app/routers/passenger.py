from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_passenger
from app.models import Booking, BookingStatus, Ride, User
from app.schemas import (
    BookingActionOut,
    BookingCreate,
    BookingOut,
    CancellationRequest,
    FellowPassengerOut,
    PaymentVerifyRequest,
    ReportCreate,
    RideOut,
    SavedPassengerCreate,
    SavedPassengerOut,
)
from app.services.booking_service import BookingService
from app.services.ride_search_service import RideSearchFilters, RideSearchService
from app.services.saved_passenger_service import SavedPassengerService
from app.utils.serializers import ride_to_out

router = APIRouter(prefix="/passenger", tags=["passenger"])


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
    filters = RideSearchFilters(
        source=source,
        destination=destination,
        journey_date=journey_date,
        min_price=min_price,
        max_price=max_price,
        seats=seats,
        departure_after=departure_after,
        departure_before=departure_before,
        pickup_point=pickup_point,
        drop_point=drop_point,
        source_area=source_area,
        destination_area=destination_area,
        driver_rating=driver_rating,
        car_type=car_type,
        fuel_type=fuel_type,
        departure_window=departure_window,
        sort_by=sort_by,
        ac_available=ac_available,
        verified_profile=verified_profile,
        instant_booking=instant_booking,
        smoking_allowed=smoking_allowed,
        pets_allowed=pets_allowed,
    )
    return RideSearchService(db).search(filters)


@router.get("/rides/{ride_id}", response_model=RideOut)
def ride_detail(ride_id: int, db: Session = Depends(get_db)) -> RideOut:
    ride = db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found"
        )
    return ride_to_out(ride)


@router.get("/rides/{ride_id}/passengers", response_model=list[FellowPassengerOut])
def ride_passengers(
    ride_id: int, db: Session = Depends(get_db)
) -> list[FellowPassengerOut]:
    ride = db.get(Ride, ride_id)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found"
        )
    return [
        FellowPassengerOut(
            name=booking.passenger.full_name,
            pickup_point=booking.pickup_point,
            drop_point=booking.drop_point,
            seats_booked=booking.seats_booked,
        )
        for booking in ride.bookings
        if booking.status in (BookingStatus.confirmed, BookingStatus.pending)
    ]


@router.post("/rides/{ride_id}/book", response_model=BookingActionOut)
def book_ride(
    ride_id: int,
    payload: BookingCreate,
    passenger: User = Depends(require_passenger),
    db: Session = Depends(get_db),
) -> BookingActionOut:
    return BookingService(db).book(ride_id, passenger, payload)


@router.post("/payments/verify", response_model=BookingOut)
def verify_payment(
    payload: PaymentVerifyRequest,
    passenger: User = Depends(require_passenger),
    db: Session = Depends(get_db),
) -> Booking:
    return BookingService(db).verify_payment(payload, passenger)


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    payload: CancellationRequest,
    passenger: User = Depends(require_passenger),
    db: Session = Depends(get_db),
) -> Booking:
    return BookingService(db).cancel_for_passenger(
        booking_id, passenger.id, payload.reason
    )


@router.get("/bookings", response_model=list[BookingOut])
def booking_history(
    passenger: User = Depends(require_passenger), db: Session = Depends(get_db)
) -> list[Booking]:
    return BookingService(db).history(passenger)


@router.get("/saved-passengers", response_model=list[SavedPassengerOut])
def list_saved_passengers(
    passenger: User = Depends(require_passenger), db: Session = Depends(get_db)
):
    return SavedPassengerService(db).list_for_user(passenger)


@router.post("/saved-passengers", response_model=SavedPassengerOut)
def add_saved_passenger(
    payload: SavedPassengerCreate,
    passenger: User = Depends(require_passenger),
    db: Session = Depends(get_db),
):
    return SavedPassengerService(db).add(passenger, payload)


@router.delete("/saved-passengers/{passenger_id}")
def delete_saved_passenger(
    passenger_id: int,
    passenger: User = Depends(require_passenger),
    db: Session = Depends(get_db),
) -> dict:
    SavedPassengerService(db).delete(passenger, passenger_id)
    return {"message": "Saved passenger removed"}


@router.post("/reports")
def report_user(
    payload: ReportCreate,
    reporter: User = Depends(require_passenger),
    db: Session = Depends(get_db),
) -> dict:
    BookingService(db).report(reporter, payload)
    return {"message": "Report submitted for admin review"}
