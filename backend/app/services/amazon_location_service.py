"""Amazon Location Service adapter for ride navigation."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from app.core.config import Settings
from app.core.exceptions import (
    ConfigurationError,
    ExternalServiceError,
    ValidationError,
)


class AmazonLocationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def calculate_route(
        self, origin_query: str, destination_query: str
    ) -> dict[str, Any]:
        api_key = self.settings.amazon_location_api_key.strip()
        if not api_key:
            raise ConfigurationError(
                "Amazon Location Service API key is not configured"
            )

        origin = self._geocode(origin_query, api_key)
        destination = self._geocode(destination_query, api_key)
        route = self._route(origin["position"], destination["position"], api_key)

        return {
            "provider": "amazon-location",
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
            **route,
        }

    def _geocode(self, query: str, api_key: str) -> dict[str, Any]:
        payload = {
            "QueryText": query,
            "MaxResults": 1,
            "Language": self.settings.amazon_location_language,
            "Filter": {"IncludeCountries": ["IND"]},
        }
        data = self._post("places", "/geocode", payload, api_key)
        result = (data.get("ResultItems") or [None])[0]
        if not result or not result.get("Position"):
            raise ValidationError(f"Could not find map coordinates for {query}")
        return {
            "label": result.get("Title") or query,
            "position": result["Position"],
        }

    def _route(
        self, origin: list[float], destination: list[float], api_key: str
    ) -> dict[str, Any]:
        payload = {
            "Origin": origin,
            "Destination": destination,
            "TravelMode": "Car",
            "TravelStepType": "Default",
            "InstructionsMeasurementSystem": "Metric",
            "Languages": [self.settings.amazon_location_language],
            "LegAdditionalFeatures": ["Summary", "TravelStepInstructions"],
            "LegGeometryFormat": "Simple",
            "Traffic": {"Usage": "UseTrafficData"},
        }
        data = self._post("routes", "/v2/routes", payload, api_key)
        routes = data.get("Routes") or []
        if not routes:
            raise ValidationError("Amazon Location could not calculate a route")

        legs = routes[0].get("Legs") or []
        distance = 0.0
        duration = 0.0
        steps: list[dict[str, Any]] = []
        geometry: list[list[float]] = []
        for leg in legs:
            summary = (
                leg.get("VehicleLegDetails") or leg.get("PedestrianLegDetails") or {}
            ).get("Summary") or {}
            overview = summary.get("Overview") or {}
            distance += float(overview.get("Distance") or 0)
            duration += float(overview.get("Duration") or 0)
            geometry.extend((leg.get("Geometry") or {}).get("LineString") or [])
            details = (
                leg.get("VehicleLegDetails") or leg.get("PedestrianLegDetails") or {}
            )
            for step in details.get("TravelSteps") or []:
                instruction = (step.get("Instruction") or "").strip()
                if instruction:
                    steps.append(
                        {
                            "instruction": instruction,
                            "distance_meters": float(step.get("Distance") or 0),
                            "duration_seconds": float(step.get("Duration") or 0),
                        }
                    )

        return {
            "distance_meters": distance,
            "duration_seconds": duration,
            "steps": steps[:12],
            "geometry": geometry,
        }

    def _post(
        self, service: str, path: str, payload: dict[str, Any], api_key: str
    ) -> dict[str, Any]:
        host = f"{service}.geo.{self.settings.amazon_location_region}.api.aws"
        url = f"https://{host}{path}?key={quote(api_key)}"
        body = json.dumps(payload).encode("utf-8")
        request = Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=12) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            message = exc.read().decode("utf-8", errors="ignore")
            raise ExternalServiceError(
                f"Amazon Location request failed with HTTP {exc.code}: {message or exc.reason}"
            ) from exc
        except (URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise ExternalServiceError("Amazon Location request failed") from exc
