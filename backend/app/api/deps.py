from fastapi import Depends, HTTPException, status, Header, Cookie
from typing import Optional

import jwt
from app.config import get_settings, Settings

ACCESS_COOKIE = "km_access"


def resolve_access_token(
    x_km_access: Optional[str] = Header(None, alias="x-km-access"),
    km_access: Optional[str] = Cookie(None, alias=ACCESS_COOKIE),
) -> Optional[str]:
    """JWT from header (SPA) or httpOnly cookie."""
    return x_km_access or km_access


def decode_admin_jwt(x_km_access: str, settings: Settings) -> Optional[dict]:
    """Return admin JWT payload if token is a valid admin JWT."""
    try:
        payload = jwt.decode(x_km_access, settings.secret_key, algorithms=["HS256"])
        if payload.get("role") == "admin":
            return payload
    except jwt.InvalidTokenError:
        pass
    return None


def is_admin_access(x_km_access: Optional[str], settings: Settings) -> bool:
    """True if caller has admin access (JWT always; raw key only outside production)."""
    if not x_km_access:
        return False
    if decode_admin_jwt(x_km_access, settings) is not None:
        return True
    if not settings.is_production and x_km_access == settings.admin_access_key:
        return True
    return False


def get_current_admin(
    token: Optional[str] = Depends(resolve_access_token),
    settings: Settings = Depends(get_settings),
):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    try:
        if not settings.is_production and token == settings.admin_access_key:
            return {"role": "admin", "sub": "legacy"}
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def get_current_user(payload: dict = Depends(get_current_admin)) -> Optional[str]:
    """Returns user_id (JWT sub) or None for legacy. Use to filter data by user."""
    sub = payload.get("sub")
    if sub == "legacy" or not sub:
        return None
    return str(sub)


def get_training_access(payload: dict = Depends(get_current_admin)) -> dict:
    """Solo chi ha fatto login con TRAINING_ACCESS_KEY può accedere alle route training."""
    if not payload.get("training"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Training access only for authorized user")
    return payload
