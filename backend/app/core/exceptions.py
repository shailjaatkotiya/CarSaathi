"""Domain exceptions and their HTTP mapping.

Services and repositories raise these framework-agnostic errors instead of
FastAPI's HTTPException. A single exception handler (registered in main.py)
translates them to HTTP responses, so business logic stays decoupled from the
web layer (Dependency Inversion) and the status-code mapping lives in one place.
"""

from __future__ import annotations

from fastapi import Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base class for expected, client-facing domain failures."""

    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT


class ValidationError(DomainError):
    status_code = status.HTTP_400_BAD_REQUEST


class PermissionError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN


class AuthError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED


async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


def register_exception_handlers(app) -> None:
    app.add_exception_handler(DomainError, domain_error_handler)
