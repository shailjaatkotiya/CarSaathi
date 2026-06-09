from datetime import datetime, timedelta, timezone
import base64
from hashlib import sha256

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        subject = payload.get("sub")
        return str(subject) if subject else None
    except JWTError:
        return None


def mask_aadhaar(aadhaar_number: str) -> str:
    clean = "".join(ch for ch in aadhaar_number if ch.isdigit())
    if len(clean) < 4:
        return "XXXX-XXXX-XXXX"
    return f"XXXX-XXXX-{clean[-4:]}"


def aadhaar_token(aadhaar_number: str) -> str:
    clean = "".join(ch for ch in aadhaar_number if ch.isdigit())
    return sha256(clean.encode("utf-8")).hexdigest()


def get_fernet() -> Fernet:
    settings = get_settings()
    key = settings.aadhaar_encryption_key
    if not key:
        digest = sha256(settings.jwt_secret_key.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest).decode("utf-8")
    return Fernet(key.encode("utf-8") if isinstance(key, str) else key)


def encrypt_aadhaar(aadhaar_number: str) -> str:
    return get_fernet().encrypt(aadhaar_number.encode("utf-8")).decode("utf-8")


def mask_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 4:
        return "XXXX"
    return f"XXXXXX{digits[-4:]}"
