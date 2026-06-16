from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.navigation import NavigationRequest, NavigationRoute
from app.services.navigation_service import NavigationService

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/rides/{ride_id}", response_model=NavigationRoute)
def ride_navigation(
    ride_id: int,
    payload: NavigationRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).ride_navigation(ride_id, payload)
