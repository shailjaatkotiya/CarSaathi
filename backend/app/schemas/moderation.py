from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=600)

    @field_validator("comment")
    @classmethod
    def clean_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ReviewOut(BaseModel):
    id: int
    booking_id: int
    rating: int
    comment: str | None = None
    reviewer_name: str
    route: str
    created_at: datetime


class DriverProfileOut(BaseModel):
    id: int
    full_name: str
    rating_average: float
    rating_count: int
    reviews: list[ReviewOut] = []


class AdminDecision(BaseModel):
    reason: str | None = None


class ReportCreate(BaseModel):
    reported_user_id: int
    ride_id: int | None = None
    reason: str
