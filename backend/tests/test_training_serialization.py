"""Unit tests for strict training serializers (anti-regression for response_model 500s)."""

from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.repositories import training as repo
from app.schemas.training import ExerciseOut, TemplateExerciseOut, WeekDayData


def test_optional_int_coercion():
    assert repo._optional_int(None) is None
    assert repo._optional_int("") is None
    assert repo._optional_int(5) == 5
    assert repo._optional_int("8") == 8
    assert repo._optional_int("bad") is None


def test_json_list_rejects_non_list():
    assert repo._json_list('["a"]') == ["a"]
    assert repo._json_list({"x": 1}) == []
    assert repo._json_list(None) == []


def test_json_dict_rejects_non_dict():
    assert repo._json_dict('{"knees": 1}') == {"knees": 1}
    assert repo._json_dict("[1]") == {}
    assert repo._json_dict(None) == {}


def test_template_exercise_dict_validates_pydantic():
    we = SimpleNamespace(
        custom_name=None,
        instruction="3-1-3",
        base_sets=4,
        base_reps="6",
    )
    ex = SimpleNamespace(
        id="ex-1",
        name="Bench",
        category="STRENGTH",
        primary_muscles='["chest"]',
        secondary_muscles=None,
        cns_fatigue=1.5,
        joint_stress='{"shoulder": 0.2}',
        is_active=1,
    )
    row = repo._template_exercise_dict(we, ex)
    parsed = TemplateExerciseOut.model_validate(row)
    assert parsed.base_reps == 6
    assert parsed.primary_muscles == ["chest"]
    assert parsed.joint_stress == {"shoulder": 0.2}


def test_exercise_out_dict_validates_pydantic():
    ex = SimpleNamespace(
        id="ex-2",
        name="Curl",
        category="HYPERTROPHY",
        primary_muscles="not-json",
        secondary_muscles='["biceps"]',
        cns_fatigue=None,
        joint_stress=None,
        is_active=1,
    )
    row = repo._exercise_out_dict(ex)
    parsed = ExerciseOut.model_validate(row)
    assert parsed.primary_muscles == []
    assert parsed.secondary_muscles == ["biceps"]
    assert parsed.joint_stress == {}


def test_week_day_data_from_serialized_template():
    day = {
        "template_id": "t1",
        "day_name": "Mon",
        "weekday": 0,
        "exercises": [
            {
                "exercise_id": "e1",
                "exercise_name": "Squat",
                "category": "STRENGTH",
                "instruction": None,
                "base_sets": 4,
                "base_reps": None,
                "primary_muscles": [],
                "secondary_muscles": [],
                "cns_fatigue": 0.0,
                "joint_stress": {},
                "is_active": 1,
            }
        ],
    }
    WeekDayData.model_validate(day)


def test_week_day_data_rejects_string_base_reps():
    day = {
        "template_id": "t1",
        "day_name": "Mon",
        "weekday": 0,
        "exercises": [
            {
                "exercise_id": "e1",
                "exercise_name": "Squat",
                "category": "STRENGTH",
                "instruction": None,
                "base_sets": 4,
                "base_reps": "",
                "primary_muscles": [],
                "secondary_muscles": [],
                "cns_fatigue": 0.0,
                "joint_stress": {},
                "is_active": 1,
            }
        ],
    }
    with pytest.raises(ValidationError):
        WeekDayData.model_validate(day)
