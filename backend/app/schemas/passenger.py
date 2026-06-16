from pydantic import BaseModel, Field, field_validator


class SavedPassengerCreate(BaseModel):
    full_name: str = Field(min_length=1)
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = None
    phone: str | None = None

    @field_validator("full_name")
    @classmethod
    def require_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Passenger name is required")
        return value


class SavedPassengerUpdate(SavedPassengerCreate):
    pass


class SavedPassengerOut(SavedPassengerCreate):
    id: int

    model_config = {"from_attributes": True}
