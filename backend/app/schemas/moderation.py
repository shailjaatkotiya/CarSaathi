from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class AdminDecision(BaseModel):
    reason: str | None = None


class ReportCreate(BaseModel):
    reported_user_id: int
    ride_id: int | None = None
    reason: str
