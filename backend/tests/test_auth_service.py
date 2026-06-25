import pytest
from types import SimpleNamespace

from app.core.exceptions import AuthError
from app.models import NotificationLog, NotificationStatus, SavedPassenger, UserRole, Vehicle
from app.schemas import PasswordLoginRequest, RegisterRequest, VehicleCreate
from app.services import auth_service
from app.services.auth_service import AuthService


def register_payload(**overrides):
    data = {
        "full_name": "Asha Patel",
        "gender": "Female",
        "mobile_number": "9876543210",
        "email": "asha@example.com",
        "username": "asha",
        "password": "password123",
        "whatsapp_number": None,
        "role": UserRole.passenger,
    }
    data.update(overrides)
    return RegisterRequest(**data)


def test_register_passenger_creates_default_saved_passenger(db):
    service = AuthService(db)

    user = service.register(register_payload())

    saved = (
        db.query(SavedPassenger)
        .filter(SavedPassenger.user_id == user.id)
        .first()
    )

    assert saved is not None
    assert saved.full_name == user.full_name
    assert saved.gender == "Female"
    assert saved.phone == "9876543210"


def test_register_driver_can_add_vehicle_during_signup(db):
    service = AuthService(db)

    user = service.register(
        register_payload(
            full_name="Karan Driver",
            gender="Male",
            mobile_number="9876543211",
            email="karan@example.com",
            username="karan",
            role=UserRole.driver,
            vehicle=VehicleCreate(
                brand="Maruti Suzuki",
                model="Swift Dzire",
                vehicle_number="gj01ab1234",
                fuel_type="Petrol",
                car_type="Sedan",
                color="White",
                seats=3,
            ),
        )
    )

    vehicle = db.query(Vehicle).filter(Vehicle.driver_id == user.id).first()

    assert vehicle is not None
    assert vehicle.vehicle_number == "GJ01AB1234"
    assert vehicle.seats == 3


def test_authenticate_with_username_and_password(db):
    service = AuthService(db)
    service.register(register_payload())

    user = service.authenticate(
        PasswordLoginRequest(username="asha", password="password123")
    )

    assert user.email == "asha@example.com"


def test_authenticate_with_otp(db, monkeypatch):
    service = AuthService(db)
    service.register(register_payload())
    sent_codes: list[str] = []

    def fake_send(_recipient: str, otp: str, _expires_minutes: int) -> NotificationStatus:
        sent_codes.append(otp)
        return NotificationStatus.sent

    monkeypatch.setattr(auth_service, "get_settings", lambda: SimpleNamespace(whatsapp_provider="twilio"))
    monkeypatch.setattr(auth_service, "send_login_otp_via_twilio", fake_send)
    status = service.send_login_otp("9876543210")
    otp = sent_codes[0]
    user = service.authenticate_with_otp("9876543210", otp)
    log = db.query(NotificationLog).filter(NotificationLog.template_name == "login_otp").first()

    assert status == NotificationStatus.sent
    assert user.username == "asha"
    assert log is not None
    assert log.status == NotificationStatus.sent


def test_authenticate_with_wrong_otp_fails(db, monkeypatch):
    service = AuthService(db)
    service.register(register_payload())

    def fake_send(_recipient: str, _otp: str, _expires_minutes: int) -> NotificationStatus:
        return NotificationStatus.sent

    monkeypatch.setattr(auth_service, "get_settings", lambda: SimpleNamespace(whatsapp_provider="twilio"))
    monkeypatch.setattr(auth_service, "send_login_otp_via_twilio", fake_send)
    service.send_login_otp("9876543210")

    with pytest.raises(AuthError):
        service.authenticate_with_otp("9876543210", "999999")
