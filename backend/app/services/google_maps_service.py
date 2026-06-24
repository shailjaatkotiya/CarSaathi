"""Google Maps Platform adapter for ride navigation.

Uses the Google Maps web service APIs (Geocoding, Places Autocomplete,
Directions). Keys stay server-side; the frontend only receives a separate
Maps-JavaScript key via map_config for rendering.
"""

from __future__ import annotations

import json
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import Settings
from app.core.exceptions import (
    ConfigurationError,
    ExternalServiceError,
    ValidationError,
)

_BASE = "https://maps.googleapis.com/maps/api"
_TAG_RE = re.compile(r"<[^>]+>")
# Address-component types to read a "city" from, most specific first.
_CITY_TYPES = (
    "locality",
    "postal_town",
    "administrative_area_level_3",
    "administrative_area_level_2",
    "administrative_area_level_1",
)


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text or "").replace("&nbsp;", " ").strip()


def _extract_city(components: list[dict[str, Any]] | None) -> str:
    """Pull the city name out of Google address_components."""
    by_type: dict[str, str] = {}
    for comp in components or []:
        for type_name in comp.get("types") or []:
            by_type.setdefault(type_name, comp.get("long_name") or "")
    for type_name in _CITY_TYPES:
        if by_type.get(type_name):
            return by_type[type_name]
    return ""


def _decode_polyline(encoded: str) -> list[list[float]]:
    """Decode a Google encoded polyline into [lng, lat] pairs."""
    coords: list[list[float]] = []
    index = lat = lng = 0
    length = len(encoded)
    while index < length:
        for is_lng in (False, True):
            shift = result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else (result >> 1)
            if is_lng:
                lng += delta
            else:
                lat += delta
        coords.append([lng / 1e5, lat / 1e5])
    return coords


class GoogleMapsService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _key(self) -> str:
        api_key = self.settings.google_maps_api_key.strip()
        if not api_key:
            raise ConfigurationError("Google Maps API key is not configured")
        return api_key

    # ---- public API --------------------------------------------------------

    def calculate_route(
        self, origin_query: str, destination_query: str
    ) -> dict[str, Any]:
        api_key = self._key()
        origin = self._geocode(origin_query, api_key)
        destination = self._geocode(destination_query, api_key)
        routes = self._fetch_routes(
            origin["position"], destination["position"], api_key, alternatives=False
        )
        summary = self._summarize_route(routes[0])
        return {
            "provider": "google-maps",
            "origin": {
                "label": origin["label"],
                "query": origin_query,
                "position": origin["position"],
            },
            "destination": {
                "label": destination["label"],
                "query": destination_query,
                "position": destination["position"],
            },
            **summary,
        }

    def route(self, origin_query: str, destination_query: str) -> dict[str, Any]:
        return self.calculate_route(origin_query, destination_query)

    def route_alternatives(
        self,
        origin_query: str,
        destination_query: str,
        max_alternatives: int = 2,
        origin_position: list[float] | None = None,
        destination_position: list[float] | None = None,
    ) -> dict[str, Any]:
        api_key = self._key()
        origin = (
            {"label": origin_query, "position": origin_position}
            if origin_position and len(origin_position) >= 2
            else self._geocode(origin_query, api_key)
        )
        destination = (
            {"label": destination_query, "position": destination_position}
            if destination_position and len(destination_position) >= 2
            else self._geocode(destination_query, api_key)
        )
        raw = self._fetch_routes(
            origin["position"],
            destination["position"],
            api_key,
            alternatives=max_alternatives > 0,
        )
        limit = max(1, min(max_alternatives or 1, 5))
        options = [self._summarize_route(route_obj) for route_obj in raw[:limit]]
        return {
            "provider": "google-maps",
            "origin": {
                "label": origin["label"],
                "query": origin_query,
                "position": origin["position"],
            },
            "destination": {
                "label": destination["label"],
                "query": destination_query,
                "position": destination["position"],
            },
            "options": options,
        }

    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        api_key = self._key()
        text = query.strip()
        if not text:
            return []
        params = {
            "input": text,
            "language": self.settings.google_maps_language,
            "components": "country:in",
            "key": api_key,
        }
        data = self._get("/place/autocomplete/json", params)
        results: list[dict[str, Any]] = []
        for item in data.get("predictions") or []:
            label = (item.get("description") or "").strip()
            if label:
                results.append({"label": label})
            if len(results) >= max(1, min(limit, 10)):
                break
        return results

    def geocode(self, query: str) -> dict[str, Any]:
        api_key = self._key()
        result = self._geocode(query.strip(), api_key)
        return {
            "label": result["label"],
            "position": result["position"],
            "city": result.get("city", ""),
        }

    def reverse_geocode(self, longitude: float, latitude: float) -> dict[str, Any]:
        api_key = self._key()
        params = {
            "latlng": f"{latitude},{longitude}",
            "language": self.settings.google_maps_language,
            "key": api_key,
        }
        data = self._get("/geocode/json", params)
        result = (data.get("results") or [None])[0]
        if not result:
            raise ValidationError("Could not resolve an address for this location")
        return {
            "label": result.get("formatted_address") or "Selected location",
            "position": [longitude, latitude],
            "city": _extract_city(result.get("address_components")),
        }

    def map_config(self) -> dict[str, Any]:
        api_key = self._key()
        return {
            "provider": "google-maps",
            "api_key": api_key,
            "language": self.settings.google_maps_language,
            "region": self.settings.google_maps_region,
        }

    # ---- internals ---------------------------------------------------------

    def _geocode(self, query: str, api_key: str) -> dict[str, Any]:
        params = {
            "address": query,
            "language": self.settings.google_maps_language,
            "components": "country:IN",
            "key": api_key,
        }
        data = self._get("/geocode/json", params)
        result = (data.get("results") or [None])[0]
        location = ((result or {}).get("geometry") or {}).get("location") or {}
        if not result or "lat" not in location or "lng" not in location:
            raise ValidationError(f"Could not find map coordinates for {query}")
        return {
            "label": result.get("formatted_address") or query,
            "position": [float(location["lng"]), float(location["lat"])],
            "city": _extract_city(result.get("address_components")),
        }

    def _fetch_routes(
        self,
        origin: list[float],
        destination: list[float],
        api_key: str,
        alternatives: bool = False,
    ) -> list[dict[str, Any]]:
        params = {
            "origin": f"{origin[1]},{origin[0]}",
            "destination": f"{destination[1]},{destination[0]}",
            "mode": "driving",
            "alternatives": "true" if alternatives else "false",
            "region": self.settings.google_maps_region,
            "language": self.settings.google_maps_language,
            "key": api_key,
        }
        data = self._get("/directions/json", params)
        routes = data.get("routes") or []
        if not routes:
            raise ValidationError("Google Maps could not calculate a route")
        return routes

    @staticmethod
    def _summarize_route(route_obj: dict[str, Any]) -> dict[str, Any]:
        legs = route_obj.get("legs") or []
        distance = 0.0
        duration = 0.0
        steps: list[dict[str, Any]] = []
        for leg in legs:
            distance += float((leg.get("distance") or {}).get("value") or 0)
            duration += float((leg.get("duration") or {}).get("value") or 0)
            for step in leg.get("steps") or []:
                instruction = _strip_html(step.get("html_instructions") or "")
                if instruction:
                    steps.append(
                        {
                            "instruction": instruction,
                            "distance_meters": float(
                                (step.get("distance") or {}).get("value") or 0
                            ),
                            "duration_seconds": float(
                                (step.get("duration") or {}).get("value") or 0
                            ),
                        }
                    )
        geometry = _decode_polyline(
            (route_obj.get("overview_polyline") or {}).get("points") or ""
        )
        warnings = " ".join(route_obj.get("warnings") or []).lower()
        summary = (route_obj.get("summary") or "").strip()
        has_tolls = "toll" in warnings or "toll" in summary.lower()
        return {
            "distance_meters": distance,
            "duration_seconds": duration,
            "steps": steps[:12],
            "geometry": geometry,
            "has_tolls": has_tolls,
            "road_label": summary,
        }

    def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        url = f"{_BASE}{path}?{urlencode(params)}"
        request = Request(url, method="GET")
        try:
            with urlopen(request, timeout=12) as response:
                data = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            message = exc.read().decode("utf-8", errors="ignore")
            raise ExternalServiceError(
                f"Google Maps request failed with HTTP {exc.code}: "
                f"{message or exc.reason}"
            ) from exc
        except (URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise ExternalServiceError("Google Maps request failed") from exc

        status = data.get("status")
        if status and status not in ("OK", "ZERO_RESULTS"):
            detail = data.get("error_message") or status
            raise ExternalServiceError(f"Google Maps error: {detail}")
        return data
