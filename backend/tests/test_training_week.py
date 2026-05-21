"""Week templates API must match WeekDayData schema (base_reps as int|null)."""

import datetime
from unittest.mock import AsyncMock, patch

import jwt
from app.config import get_settings


def _training_jwt() -> str:
    settings = get_settings()
    payload = {
        "role": "admin",
        "sub": "admin",
        "training": True,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


@patch(
    "app.api.routes.training.crud_training.get_week_templates",
    new_callable=AsyncMock,
    return_value=[
        {
            "template_id": "tmpl-1",
            "day_name": "Lunedì",
            "weekday": 0,
            "exercises": [
                {
                    "exercise_id": "ex-1",
                    "exercise_name": "Squat",
                    "category": "STRENGTH",
                    "instruction": "",
                    "base_sets": 4,
                    "base_reps": 5,
                    "primary_muscles": [],
                    "secondary_muscles": [],
                    "cns_fatigue": 0.0,
                    "joint_stress": {},
                    "is_active": 1,
                }
            ],
        }
    ],
)
def test_get_week_returns_200_with_valid_schema(mock_get_week, client):
    token = _training_jwt()
    saved = dict(client.headers)
    client.headers.clear()
    r = client.get("/api/training/week", headers={"x-km-access": token})
    client.headers.update(saved)
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["exercises"][0]["base_reps"] == 5
    mock_get_week.assert_awaited_once()
