import re
from pathlib import Path


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_markdown(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "file_not_found",
            "error_message": f"File not found: {path}",
            "diagnostics": {},
        }
    try:
        raw_text = p.read_text(encoding="utf-8", errors="replace")
        clean_text = _normalize(raw_text)
    except Exception as e:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "read_error",
            "error_message": str(e),
            "diagnostics": {},
        }
    return {"raw_text": raw_text, "clean_text": clean_text, "diagnostics": {}}
