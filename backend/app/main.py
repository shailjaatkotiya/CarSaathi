import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.database import Base, SessionLocal, engine, ensure_runtime_schema
from app.routers import (
    admin,
    auth,
    driver,
    navigation,
    passenger,
    payments,
    profile,
)
from app.seed import seed_database

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


os.makedirs(settings.media_root, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_root), name="media")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "Carthi API"}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(driver.router, prefix="/api/v1")
app.include_router(passenger.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(navigation.router, prefix="/api/v1")
