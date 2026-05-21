"""Security tests for training routes (audit-events, shared write)."""

from unittest.mock import AsyncMock, patch

import jwt
import datetime
from app.config import get_settings


def _admin_jwt() -> str:
    settings = get_settings()
    payload = {
        "role": "admin",
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def test_audit_events_requires_auth(client):
    saved = dict(client.headers)
    client.headers.clear()
    r = client.get("/api/training/audit-events")
    assert r.status_code == 401
    client.headers.update(saved)


@patch("app.repositories.audit.get_events", new_callable=AsyncMock, return_value=[])
def test_audit_events_ok_for_admin(mock_get_events, client):
    r = client.get("/api/training/audit-events", params={"limit": 5})
    assert r.status_code == 200
    assert r.json() == []
    mock_get_events.assert_awaited_once()


@patch("app.repositories.audit.get_events", new_callable=AsyncMock, return_value=[])
def test_audit_events_ok_with_jwt(mock_get_events, client):
    token = _admin_jwt()
    saved = dict(client.headers)
    client.headers.clear()
    r = client.get(
        "/api/training/audit-events",
        headers={"x-km-access": token},
        params={"limit": 3},
    )
    assert r.status_code == 200
    client.headers.update(saved)


@patch(
    "app.services.dashboard_service.get_shared_dashboard",
    new_callable=AsyncMock,
    return_value={"share_id": "test-share", "title": "T", "data": {"projects": []}},
)
def test_shared_dashboard_read_denied_without_admin_or_token(mock_get, client):
    share_id = "test-unprotected-read"
    saved = dict(client.headers)
    client.headers.clear()
    r = client.get(f"/api/training/shared-dashboard/{share_id}")
    assert r.status_code == 403
    client.headers.update(saved)
    mock_get.assert_awaited()


@patch(
    "app.services.dashboard_service.get_shared_dashboard",
    new_callable=AsyncMock,
    return_value={"share_id": "test-share", "title": "T", "data": {"projects": []}},
)
def test_shared_dashboard_write_denied_without_admin_or_token(mock_get, client):
    share_id = "test-unprotected-write"
    saved = dict(client.headers)
    client.headers.clear()
    r = client.put(
        f"/api/training/shared-dashboard/{share_id}",
        json={"data": {"projects": []}, "title": "Test"},
    )
    assert r.status_code == 403
    client.headers.update(saved)
    mock_get.assert_awaited()
