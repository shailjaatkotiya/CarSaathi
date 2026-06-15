from pydantic import BaseModel, Field, field_validator


class VehicleCreate(BaseModel):
    brand: str
    model: str
    vehicle_number: str
    fuel_type: str
    car_type: str = "Sedan"
    color: str = "White"
    seats: int = Field(ge=1, le=8)
    photo_urls: list[str] = []

    @field_validator("vehicle_number")
    @classmethod
    def require_vehicle_number(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Vehicle number is required")
        return value.upper()

    @field_validator("color")
    @classmethod
    def normalize_color(cls, value: str) -> str:
        return value.strip() or "White"


class VehicleOut(VehicleCreate):
    id: int
    is_verified: bool

    model_config = {"from_attributes": True}

    @field_validator("photo_urls", mode="before")
    @classmethod
    def split_photo_urls(cls, value: object) -> list[str]:
        if isinstance(value, str):
            return [url for url in value.split(",") if url]
        if isinstance(value, list):
            return value
        return []
