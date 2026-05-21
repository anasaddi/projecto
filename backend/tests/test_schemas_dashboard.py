"""Dashboard schema validation tests."""

from app.schemas.dashboard import validate_dashboard_data


def test_validate_dashboard_data_accepts_minimal_payload():
    payload = validate_dashboard_data(
        {
            "dailyTaskTemplates": [],
            "dailyTaskLogs": {},
            "projects": [],
            "quickTasks": [],
            "prayerLogs": {},
            "top3Manual": [None, None, None],
            "dailyCompletionLog": {},
            "lifeGoals": {"collapsed": False, "tiers": []},
            "timelineRoutines": {},
        }
    )
    assert payload.projects == []
    assert payload.daily_task_templates == []
