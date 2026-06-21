from pydantic import BaseModel, Field


class NavigationRequest(BaseModel):
    pickup_point: str = Field(min_length=1, max_length=160)
    drop_point: str = Field(min_length=1, max_length=160)


class NavigationPlace(BaseModel):
    label: str
    query: str
    position: list[float]


class NavigationStep(BaseModel):
    instruction: str
    distance_meters: float = 0
    duration_seconds: float = 0


class NavigationRoute(BaseModel):
    provider: str = "google-maps"
    origin: NavigationPlace
    destination: NavigationPlace
    distance_meters: float
    duration_seconds: float
    steps: list[NavigationStep] = []
    geometry: list[list[float]] = []


class NavigationRouteRequest(BaseModel):
    origin_query: str = Field(min_length=1, max_length=200)
    destination_query: str = Field(min_length=1, max_length=200)
    max_alternatives: int = Field(default=2, ge=0, le=5)
    # Optional [lng, lat] of each end. When present they are used directly and
    # the text query is skipped — avoids re-geocoding a vague POI label.
    origin_position: list[float] | None = None
    destination_position: list[float] | None = None


class NavigationRouteOption(BaseModel):
    distance_meters: float = 0
    duration_seconds: float = 0
    steps: list[NavigationStep] = []
    geometry: list[list[float]] = []
    has_tolls: bool = False
    road_label: str = ""


class NavigationRouteOptions(BaseModel):
    provider: str = "google-maps"
    origin: NavigationPlace
    destination: NavigationPlace
    options: list[NavigationRouteOption] = []


class NavigationReverse(BaseModel):
    label: str
    position: list[float]
    # City extracted from the address (locality). Empty if Google had none.
    city: str = ""


class NavigationSuggestion(BaseModel):
    label: str


class NavigationMapConfig(BaseModel):
    provider: str = "google-maps"
    # Maps JavaScript API key handed to the browser to render the map. Use a
    # referrer-restricted, Maps-JS-scoped key in Cloud Console.
    api_key: str
    language: str = "en"
    region: str = "in"
