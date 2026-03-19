from fastapi import Depends, HTTPException, status, Header
from typing import Optional

import jwt
from app.config import get_settings, Settings


def get_current_admin(
    x_km_access: Optional[str] = Header(None, alias="x-km-access"),
    settings: Settings = Depends(get_settings),
):
    if not x_km_access:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    try:
        if x_km_access == settings.admin_access_key:
            return {"role": "admin", "sub": "legacy"}
        payload = jwt.decode(x_km_access, settings.secret_key, algorithms=["HS256"])
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
