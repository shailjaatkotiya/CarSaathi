from app.models import SavedPassenger, UserRole
from app.schemas import RegisterRequest
from app.services.auth_service import AuthService


def test_register_passenger_creates_default_saved_passenger(db):
    service = AuthService(db)

    user = service.register(
        RegisterRequest(
            full_name="Asha Patel",
            email="asha@example.com",
            password="password123",
            whatsapp_number="9876543210",
            role=UserRole.passenger,
        )
    )

    saved = (
        db.query(SavedPassenger)
        .filter(SavedPassenger.user_id == user.id)
        .first()
    )

    assert saved is not None
    assert saved.full_name == user.full_name
