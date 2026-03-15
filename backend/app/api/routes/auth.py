from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
import jwt
import datetime
from typing import Optional
from app.config import get_settings, Settings
from app.api.deps import get_current_admin

router = APIRouter()

class LoginRequest(BaseModel):
    key: str

def create_access_token(data: dict, secret_key: str, expires_delta: datetime.timedelta):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

@router.post("/login")
async def login(req: LoginRequest, settings: Settings = Depends(get_settings)):
    if req.key != settings.admin_access_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access key"
        )
    
    access_token = create_access_token(
        data={"role": "admin"},
        secret_key=settings.secret_key,
        expires_delta=datetime.timedelta(days=7) # Token lasts 7 days
    )
    return {"token": access_token, "role": "admin"}

@router.get("/verify")
async def verify_token(current_admin: dict = Depends(get_current_admin)):
    """Verify if the provided token is valid."""
    return {"status": "valid", "role": current_admin.get("role", "admin")}
