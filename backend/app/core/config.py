from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RideSaathi API"
    environment: str = "local"
    database_url: str = "sqlite:///./ridesaathi.db"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    aadhaar_encryption_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5176,http://127.0.0.1:5176,http://localhost:5177,http://127.0.0.1:5177"
    public_api_base_url: str = "http://localhost:8000/api/v1"
    whatsapp_provider: str = "mock"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = ""
    twilio_messaging_service_sid: str = ""
    # Approved WhatsApp template Content SIDs (HX...). Empty = send freeform
    # body instead (works in sandbox / inside the 24h customer-service window).
    twilio_content_sid_passenger_booking_confirmation: str = ""
    twilio_content_sid_driver_booking_request: str = ""
    twilio_content_sid_passenger_booking_cancelled: str = ""
    twilio_content_sid_driver_booking_cancelled: str = ""

    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.environment == "local":
            origins.extend(
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5176",
                    "http://127.0.0.1:5176",
                    "http://localhost:5177",
                    "http://127.0.0.1:5177",
                ]
            )
        return list(dict.fromkeys(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()
