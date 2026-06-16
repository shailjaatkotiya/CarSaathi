from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_driver
from app.models import User
from app.schemas import (
    BookingOut,
    CancellationRequest,
    DriverBookingOut,
    RideCreate,
    RideOut,
    VehicleCreate,
    VehicleOut,
)
from app.services.driver_ride_service import DriverRideService
from app.services.vehicle_service import VehicleService
from app.utils.serializers import driver_booking_to_out, ride_to_out

router = APIRouter(prefix="/driver", tags=["driver"])


# ----- vehicles -------------------------------------------------------------
@router.post("/vehicles", response_model=VehicleOut)
def add_vehicle(
    payload: VehicleCreate,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    return VehicleService(db).add(driver, payload)


@router.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(
    driver: User = Depends(require_driver), db: Session = Depends(get_db)
):
    return VehicleService(db).list_for_driver(driver)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleCreate,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    return VehicleService(db).update(driver, vehicle_id, payload)


# ----- rides ----------------------------------------------------------------
@router.post("/rides", response_model=RideOut)
def create_ride(
    payload: RideCreate,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
) -> RideOut:
    ride = DriverRideService(db).publish(driver, payload)
    return ride_to_out(ride)


@router.get("/rides", response_model=list[RideOut])
def my_rides(
    driver: User = Depends(require_driver), db: Session = Depends(get_db)
) -> list[RideOut]:
    return [ride_to_out(ride) for ride in DriverRideService(db).list_for_driver(driver)]


@router.post("/rides/{ride_id}/cancel")
def cancel_ride(
    ride_id: int,
    payload: CancellationRequest,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
) -> dict:
    DriverRideService(db).cancel(ride_id, driver, payload.reason)
    return {"message": "Ride cancelled"}


@router.post("/rides/{ride_id}/complete")
def complete_ride(
    ride_id: int,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
) -> dict:
    DriverRideService(db).complete(ride_id, driver)
    return {"message": "Ride marked completed"}


@router.get("/rides/{ride_id}/bookings", response_model=list[DriverBookingOut])
def ride_bookings(
    ride_id: int,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
) -> list[DriverBookingOut]:
    return [
        driver_booking_to_out(booking)
        for booking in DriverRideService(db).ride_bookings(ride_id, driver)
    ]


# ----- booking decisions ----------------------------------------------------
@router.post("/bookings/{booking_id}/accept", response_model=BookingOut)
def accept_booking(
    booking_id: int,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    return DriverRideService(db).accept_booking_for_driver(booking_id, driver)


@router.post("/bookings/{booking_id}/reject", response_model=BookingOut)
def reject_booking(
    booking_id: int,
    driver: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    return DriverRideService(db).reject_booking_for_driver(
        booking_id,
        driver,
        "Driver rejected the booking from the application",
    )


@router.get("/whatsapp/bookings/{booking_code}/accept", response_model=BookingOut)
def accept_booking_from_whatsapp(booking_code: str, db: Session = Depends(get_db)):
    return DriverRideService(db).accept_booking_by_code(booking_code)


@router.get("/whatsapp/bookings/{booking_code}/reject", response_model=BookingOut)
def reject_booking_from_whatsapp(booking_code: str, db: Session = Depends(get_db)):
    return DriverRideService(db).reject_booking_by_code(
        booking_code,
        "Driver rejected the booking from WhatsApp",
    )


@router.get("/bookings/active")
def active_driver_bookings(
    driver: User = Depends(require_driver), db: Session = Depends(get_db)
) -> list[dict]:
    rows = DriverRideService(db).active_bookings(driver)
    return [
        {
            "id": booking.id,
            "booking_code": booking.booking_code,
            "status": booking.status,
            "seats_booked": booking.seats_booked,
            "pickup_point": booking.pickup_point,
            "drop_point": booking.drop_point,
            "total_amount": booking.total_amount,
            "payment_method": booking.payment_method,
            "payment_status": booking.payment_status,
            "passenger_name": booking.passenger.full_name,
            "passenger_whatsapp": booking.passenger.whatsapp_number,
            "route": f"{booking.ride.source_city} to {booking.ride.destination_city}",
            "journey_date": booking.ride.journey_date.isoformat(),
            "departure_time": booking.ride.departure_time.isoformat(),
        }
        for booking in rows
    ]
