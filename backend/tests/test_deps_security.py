"""Unit tests for admin access helpers."""

from app.api.deps import decode_admin_jwt, is_admin_access
from app.config import get_settings


def test_is_admin_access_raw_key_only_outside_production():
    settings = get_settings()
    assert is_admin_access(settings.admin_access_key, settings) is True


def test_is_admin_access_rejects_raw_key_when_production(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "production")
    assert is_admin_access(settings.admin_access_key, settings) is False


def test_decode_admin_jwt_valid():
    import datetime
    import jwt

    settings = get_settings()
    token = jwt.encode(
        {
            "role": "admin",
            "sub": "admin",
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
        },
        settings.secret_key,
        algorithm="HS256",
    )
    payload = decode_admin_jwt(token, settings)
    assert payload is not None
    assert payload.get("sub") == "admin"
