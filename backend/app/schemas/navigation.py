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
    provider: str = "amazon-location"
    origin: NavigationPlace
    destination: NavigationPlace
    distance_meters: float
    duration_seconds: float
    steps: list[NavigationStep] = []
    geometry: list[list[float]] = []
