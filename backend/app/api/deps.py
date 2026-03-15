from fastapi import Depends, HTTPException, status, Header
from typing import Optional
import jwt
from app.config import get_settings, Settings

def get_current_admin(
    x_km_access: Optional[str] = Header(None, alias="x-km-access"),
    settings: Settings = Depends(get_settings)
):
    if not x_km_access:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )
    
    try:
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
        # Fallback to check if it's the raw admin key (for backward compatibility during migration)
        if x_km_access == settings.admin_access_key:
            return {"role": "admin", "sub": "legacy"}
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
