from typing import Any


DEFAULT_SCHEMA_VERSION = 1


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    return False


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _base_strength_row(week: int) -> dict:
    return {
        "week": week,
        "anas": {"weight": "", "reps": "", "completed": False},
        "flavio": {"weight": "", "reps": "", "completed": False},
    }


def _sanitize_strength_row(row: Any, week: int) -> dict:
    if not isinstance(row, dict):
        row = {}

    anas = row.get("anas") if isinstance(row.get("anas"), dict) else {}
    flavio = row.get("flavio") if isinstance(row.get("flavio"), dict) else {}

    return {
        "week": week,
        "anas": {
            "weight": _as_text(anas.get("weight")),
            "reps": _as_text(anas.get("reps")),
            "completed": _as_bool(anas.get("completed")),
        },
        "flavio": {
            "weight": _as_text(flavio.get("weight")),
            "reps": _as_text(flavio.get("reps")),
            "completed": _as_bool(flavio.get("completed")),
        },
    }


def sanitize_strength_progression(data: Any) -> dict:
    source = data if isinstance(data, dict) else {}

    tm_by_month = source.get("tmByMonth")
    if not isinstance(tm_by_month, list):
        tm_by_month = []
    normalized_tm = []
    for i in range(5):
        item = tm_by_month[i] if i < len(tm_by_month) and isinstance(tm_by_month[i], dict) else {}
        normalized_tm.append({
            "anas": _as_text(item.get("anas")),
            "flavio": _as_text(item.get("flavio")),
        })

    data_by_month = source.get("dataByMonth")
    if not isinstance(data_by_month, list):
        data_by_month = []
    normalized_months = []
    for m in range(6):
        month_rows = data_by_month[m] if m < len(data_by_month) and isinstance(data_by_month[m], list) else []
        normalized_rows = []
        for idx, week in enumerate([1, 2, 3, 4]):
            current = month_rows[idx] if idx < len(month_rows) else _base_strength_row(week)
            normalized_rows.append(_sanitize_strength_row(current, week))
        normalized_months.append(normalized_rows)

    return {
        "schemaVersion": DEFAULT_SCHEMA_VERSION,
        "tmAnas": _as_text(source.get("tmAnas")),
        "tmFlavio": _as_text(source.get("tmFlavio")),
        "tmByMonth": normalized_tm,
        "dataByMonth": normalized_months,
    }


def sanitize_generic_progression(data: Any) -> dict:
    source = data if isinstance(data, dict) else {}
    out = {"schemaVersion": DEFAULT_SCHEMA_VERSION}
    for k, v in source.items():
        if k == "schemaVersion":
            continue
        out[k] = v
    return out

