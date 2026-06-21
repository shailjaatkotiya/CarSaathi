from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.navigation import (
    NavigationMapConfig,
    NavigationRequest,
    NavigationReverse,
    NavigationRoute,
    NavigationRouteOptions,
    NavigationRouteRequest,
    NavigationSuggestion,
)
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


@router.post("/route", response_model=NavigationRoute)
def route(
    payload: NavigationRouteRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).route(payload.origin_query, payload.destination_query)


@router.post("/routes", response_model=NavigationRouteOptions)
def route_alternatives(
    payload: NavigationRouteRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).route_alternatives(
        payload.origin_query,
        payload.destination_query,
        payload.max_alternatives,
        payload.origin_position,
        payload.destination_position,
    )


# Read-only Google-proxy lookups. Public so the guest-accessible ride search
# (and landing page) can offer city autocomplete without a login. No user data
# is involved; the Google key stays server-side.
@router.get("/reverse", response_model=NavigationReverse)
def reverse_geocode(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).reverse_geocode(lng, lat)


@router.get("/geocode", response_model=NavigationReverse)
def geocode(
    q: str = Query(min_length=1, max_length=200),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).geocode(q)


@router.get("/search", response_model=list[NavigationSuggestion])
def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> list[dict]:
    return NavigationService(db).search(q, limit)


@router.get("/map-config", response_model=NavigationMapConfig)
def map_config(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return NavigationService(db).map_config()
