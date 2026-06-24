from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import ValidationError
from app.services.google_maps_service import GoogleMapsService


class NavigationService:
    """Thin proxy over Google Maps for the publish/search flows. Read-only —
    persistence of the driver-chosen route lives on the Ride itself."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.maps = GoogleMapsService(get_settings())

    def map_config(self) -> dict:
        return self.maps.map_config()

    def search(self, query: str, limit: int = 5) -> list[dict]:
        return self.maps.search(query, limit)

    def route(self, origin_query: str, destination_query: str) -> dict:
        origin = origin_query.strip()
        destination = destination_query.strip()
        if not origin or not destination:
            raise ValidationError("Enter both an origin and a destination.")
        return self.maps.route(origin, destination)

    def route_alternatives(
        self,
        origin_query: str,
        destination_query: str,
        max_alternatives: int = 2,
        origin_position: list[float] | None = None,
        destination_position: list[float] | None = None,
    ) -> dict:
        origin = origin_query.strip()
        destination = destination_query.strip()
        if not origin or not destination:
            raise ValidationError("Enter both an origin and a destination.")
        return self.maps.route_alternatives(
            origin,
            destination,
            max_alternatives,
            origin_position,
            destination_position,
        )

    def reverse_geocode(self, longitude: float, latitude: float) -> dict:
        return self.maps.reverse_geocode(longitude, latitude)

    def geocode(self, query: str) -> dict:
        if not query.strip():
            raise ValidationError("Enter a place to look up.")
        return self.maps.geocode(query)
