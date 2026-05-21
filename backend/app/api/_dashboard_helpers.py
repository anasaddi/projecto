"""Shared dashboard helpers for training and bootstrap routes."""
import hashlib
import json
from datetime import datetime
from typing import Any

EMPTY_DASHBOARD = {
    "dailyTaskTemplates": [],
    "dailyTaskLogs": {},
    "projects": [],
    "quickTasks": [],
    "prayerLogs": {},
    "top3Manual": [None, None, None],
    "dailyCompletionLog": {},
    "lifeGoals": {"collapsed": False, "tiers": []},
}


def has_meaningful_dashboard_data(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    life_goals = data.get("lifeGoals") if isinstance(data.get("lifeGoals"), dict) else None
    tiers = life_goals.get("tiers") if isinstance(life_goals, dict) else None
    return any(
        [
            isinstance(data.get("dailyTaskTemplates"), list) and len(data.get("dailyTaskTemplates") or []) > 0,
            isinstance(data.get("projects"), list) and len(data.get("projects") or []) > 0,
            isinstance(data.get("quickTasks"), list) and len(data.get("quickTasks") or []) > 0,
            isinstance(tiers, list) and any(isinstance(t, dict) and len(t.get("goals") or []) > 0 for t in tiers),
        ]
    )


def dashboard_snapshot_or_empty(data: Any) -> dict:
    return data if isinstance(data, dict) and has_meaningful_dashboard_data(data) else EMPTY_DASHBOARD


def dashboard_etag(user_id: str | None, data: Any, updated_at: datetime | None = None) -> str:
    uid = user_id or "default"
    if updated_at is not None:
        return f'W/"{uid}-{int(updated_at.timestamp())}"'
    payload = json.dumps(data, sort_keys=True, default=str)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return f'W/"{uid}-{digest}"'


def safe_shared_dashboard_data(data: Any) -> dict:
    if isinstance(data, dict):
        return data
    if isinstance(data, list):
        return {"items": data}
    return {}
