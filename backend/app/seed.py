from datetime import date, time, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import AdminUser, DriverProfile, PassengerProfile, Ride, RideDropPoint, RidePickupPoint, User, Vehicle, VerificationStatus


def tagged_notes(notes: str, route_stops: list[str], ride_rules: list[str], driver_instructions: str) -> str:
    return "\n\n".join(
        [
            notes,
            f"[route_stops]{'|'.join(route_stops)}[/route_stops]",
            f"[ride_rules]{'|'.join(ride_rules)}[/ride_rules]",
            f"[driver_instructions]{driver_instructions}[/driver_instructions]",
        ]
    )


def ensure_default_admin(db: Session) -> None:
    admin = db.query(User).filter(User.email == "admin@ridesaathi.in").first()
    if not admin:
        admin = User(
            full_name="RideSaathi Admin",
            email="admin@ridesaathi.in",
            password_hash=hash_password("Admin@123"),
            verification_status=VerificationStatus.verified,
        )
        db.add(admin)
        db.flush()
    if not db.query(AdminUser).filter(AdminUser.user_id == admin.id).first():
        db.add(AdminUser(user_id=admin.id))
        db.commit()


def seed_database(db: Session) -> None:
    if db.query(User).first():
        ensure_default_admin(db)
        return

    shubham = User(
        full_name="Shubham",
        email="shubham@gmail.com",
        password_hash=hash_password("driver@123"),
        verification_status=VerificationStatus.pending,
    )
    shailja = User(
        full_name="Shailja",
        email="shailja@gmail.com",
        password_hash=hash_password("passenger@123"),
        verification_status=VerificationStatus.pending,
    )
    dummy_drivers = [
        User(
            full_name="Aarav Patel",
            email="aarav.driver@carsaathi.in",
            password_hash=hash_password("driver@123"),
            verification_status=VerificationStatus.verified,
            rating_average=4.8,
            rating_count=26,
        ),
        User(
            full_name="Mehul Shah",
            email="mehul.driver@carsaathi.in",
            password_hash=hash_password("driver@123"),
            verification_status=VerificationStatus.verified,
            rating_average=4.6,
            rating_count=19,
        ),
        User(
            full_name="Rohan Trivedi",
            email="rohan.driver@carsaathi.in",
            password_hash=hash_password("driver@123"),
            verification_status=VerificationStatus.verified,
            rating_average=4.9,
            rating_count=34,
        ),
        User(
            full_name="Nikhil Desai",
            email="nikhil.driver@carsaathi.in",
            password_hash=hash_password("driver@123"),
            verification_status=VerificationStatus.verified,
            rating_average=4.7,
            rating_count=22,
        ),
    ]
    users = [shubham, shailja, *dummy_drivers]
    db.add_all(users)
    db.flush()

    for driver in [shubham, shailja, *dummy_drivers]:
        db.add(
            DriverProfile(
                user_id=driver.id,
                driving_license_number=None if driver is shubham else f"GJ-DRV-{driver.id:06d}",
                bio=None if driver is shubham else "Verified Gujarat intercity driver with clean car and planned halts.",
                auto_confirm_bookings=False,
                completed_trips=0 if driver is shubham else 18 + driver.id,
                total_earnings=0 if driver is shubham else 22000 + driver.id * 1200,
            )
        )
        db.add(PassengerProfile(user_id=driver.id))
    ensure_default_admin(db)

    vehicles = [
        Vehicle(driver_id=dummy_drivers[0].id, brand="Maruti Suzuki", model="Dzire", vehicle_number="GJ01AA1234", fuel_type="Petrol", car_type="Sedan", seats=3, photo_urls="", is_verified=True),
        Vehicle(driver_id=dummy_drivers[0].id, brand="Hyundai", model="Creta", vehicle_number="GJ01BB5678", fuel_type="Diesel", car_type="SUV", seats=3, photo_urls="", is_verified=True),
        Vehicle(driver_id=dummy_drivers[1].id, brand="Toyota", model="Innova Crysta", vehicle_number="GJ03CC9012", fuel_type="CNG", car_type="7 Seater", seats=6, photo_urls="", is_verified=True),
        Vehicle(driver_id=dummy_drivers[2].id, brand="Honda", model="Amaze", vehicle_number="GJ10DD7890", fuel_type="Petrol", car_type="Sedan", seats=3, photo_urls="", is_verified=True),
        Vehicle(driver_id=dummy_drivers[3].id, brand="Tata", model="Nexon EV", vehicle_number="GJ05EE3456", fuel_type="EV", car_type="SUV", seats=3, photo_urls="", is_verified=True),
    ]
    db.add_all(vehicles)
    db.flush()

    today = date.today()
    common_rules = ["no_pets", "no_smoking", "no_alcohol", "no_tobacco"]
    ride_items = [
        {
            "vehicle": vehicles[0],
            "source_city": "Ahmedabad",
            "destination_city": "Rajkot",
            "distance_km": 235,
            "journey_date": today + timedelta(days=2),
            "departure_time": time(7, 30),
            "available_seats": 3,
            "price_per_seat": 320,
            "pickup_points": ["Bopal", "Gota", "Iscon Cross Road", "SG Highway", "Satellite"],
            "route_stops": ["Limbdi", "Chotila"],
            "drop_points": ["Gondal Road", "Kalawad Road", "Rajkot Bus Stand", "University Road", "Mavdi Circle"],
            "route_notes": "Morning sedan ride with a tea halt near Limbdi.",
            "driver_instructions": "Please arrive 10 minutes early. One cabin bag only.",
        },
        {
            "vehicle": vehicles[1],
            "source_city": "Rajkot",
            "destination_city": "Ahmedabad",
            "distance_km": 238,
            "journey_date": today + timedelta(days=3),
            "departure_time": time(16, 0),
            "available_seats": 2,
            "price_per_seat": 350,
            "pickup_points": ["Rajkot Bus Stand", "Kalawad Road", "Gondal Road", "University Road", "Mavdi Circle"],
            "route_stops": ["Chotila", "Limbdi"],
            "drop_points": ["Iscon Cross Road", "Bopal", "Gota", "Satellite", "SG Highway"],
            "route_notes": "Evening SUV ride with AC and flexible halts.",
            "driver_instructions": "Confirm pickup point on WhatsApp before departure.",
        },
        {
            "vehicle": vehicles[2],
            "source_city": "Rajkot",
            "destination_city": "Jamnagar",
            "distance_km": 96,
            "journey_date": today + timedelta(days=1),
            "departure_time": time(9, 15),
            "available_seats": 5,
            "price_per_seat": 190,
            "pickup_points": ["Rajkot Bus Stand", "Kalawad Road", "Gondal Road", "University Road", "Mavdi Circle"],
            "route_stops": ["Dhrol", "Reliance Circle"],
            "drop_points": ["Jamnagar Bus Stand", "Patel Colony", "Reliance Circle", "Digjam Circle", "Railway Station"],
            "route_notes": "7 seater CNG ride for groups and families.",
            "driver_instructions": "No extra children without seat booking.",
        },
        {
            "vehicle": vehicles[3],
            "source_city": "Jamnagar",
            "destination_city": "Rajkot",
            "distance_km": 94,
            "journey_date": today + timedelta(days=2),
            "departure_time": time(18, 45),
            "available_seats": 3,
            "price_per_seat": 180,
            "pickup_points": ["Jamnagar Bus Stand", "Patel Colony", "Reliance Circle", "Digjam Circle", "Railway Station"],
            "route_stops": ["Dhrol", "Paddhari"],
            "drop_points": ["Rajkot Bus Stand", "Kalawad Road", "Gondal Road", "University Road", "Mavdi Circle"],
            "route_notes": "Petrol sedan office-return ride.",
            "driver_instructions": "Small bags preferred. No tobacco inside car.",
            "ac_available": False,
        },
        {
            "vehicle": vehicles[4],
            "source_city": "Ahmedabad",
            "destination_city": "Surat",
            "distance_km": 265,
            "journey_date": today + timedelta(days=4),
            "departure_time": time(6, 45),
            "available_seats": 3,
            "price_per_seat": 420,
            "pickup_points": ["Bopal", "Gota", "Iscon Cross Road", "Prahladnagar", "Narol"],
            "route_stops": ["Vadodara", "Bharuch", "Ankleshwar"],
            "drop_points": ["Adajan", "Varachha", "Surat Railway Station", "Athwa Gate", "Piplod"],
            "route_notes": "EV SUV ride via Expressway with charging buffer.",
            "driver_instructions": "Carry compact luggage. Charging halt may take 15 minutes.",
        },
        {
            "vehicle": vehicles[0],
            "source_city": "Ahmedabad",
            "destination_city": "Vadodara",
            "distance_km": 115,
            "journey_date": today + timedelta(days=2),
            "departure_time": time(12, 0),
            "available_seats": 3,
            "price_per_seat": 200,
            "pickup_points": ["Bopal", "Gota", "Iscon Cross Road", "Narol", "Maninagar"],
            "route_stops": ["Nadiad", "Anand"],
            "drop_points": ["Alkapuri", "Fatehgunj", "Gotri", "Akota", "Vadodara Railway Station"],
            "route_notes": "Short petrol sedan ride.",
            "driver_instructions": "No music unless all passengers agree.",
            "ac_available": False,
        },
    ]

    for item in ride_items:
        vehicle = item.pop("vehicle")
        pickup_points = item.pop("pickup_points")
        drop_points = item.pop("drop_points")
        route_stops = item.pop("route_stops")
        driver_instructions = item.pop("driver_instructions")
        ac_available = item.pop("ac_available", True)
        notes = tagged_notes(item.pop("route_notes"), route_stops, common_rules, driver_instructions)
        ride = Ride(
            driver_id=vehicle.driver_id,
            vehicle_id=vehicle.id,
            route_key=f"{item['source_city'].lower()}:{item['destination_city'].lower()}",
            total_seats=item["available_seats"],
            auto_confirm_bookings=False,
            smoking_allowed=False,
            women_only_preference=False,
            route_notes=notes,
            luggage_allowance="One cabin bag per passenger",
            ac_available=ac_available,
            **item,
        )
        db.add(ride)
        db.flush()
        db.add_all([RidePickupPoint(ride_id=ride.id, name=name) for name in pickup_points])
        db.add_all([RideDropPoint(ride_id=ride.id, name=name) for name in drop_points])

    db.commit()
