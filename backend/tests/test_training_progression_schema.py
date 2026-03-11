from app.crud.progression_schema import sanitize_strength_progression, sanitize_generic_progression


def test_sanitize_strength_progression_builds_required_shape():
    raw = {
        "tmAnas": 90,
        "tmByMonth": [{"anas": 85}, "bad"],
        "dataByMonth": [
            [
                {"week": 1, "anas": {"weight": 80, "reps": 5, "completed": 1}},
                {"week": 2, "flavio": {"weight": 75, "reps": 4, "completed": "true"}},
            ]
        ],
    }

    sanitized = sanitize_strength_progression(raw)

    assert sanitized["schemaVersion"] == 1
    assert len(sanitized["tmByMonth"]) == 5
    assert len(sanitized["dataByMonth"]) == 6
    assert len(sanitized["dataByMonth"][0]) == 4
    assert sanitized["tmAnas"] == "90"
    assert sanitized["tmFlavio"] == ""
    assert sanitized["dataByMonth"][0][0]["anas"]["weight"] == "80"
    assert sanitized["dataByMonth"][0][0]["anas"]["reps"] == "5"
    assert sanitized["dataByMonth"][0][0]["anas"]["completed"] is True
    assert sanitized["dataByMonth"][0][1]["flavio"]["completed"] is True


def test_sanitize_generic_progression_preserves_payload_and_adds_version():
    raw = {"rows": [{"anas": {"weight": "20"}}], "foo": "bar"}
    sanitized = sanitize_generic_progression(raw)
    assert sanitized["schemaVersion"] == 1
    assert sanitized["rows"] == raw["rows"]
    assert sanitized["foo"] == "bar"

