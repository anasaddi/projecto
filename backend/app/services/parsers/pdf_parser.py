import re
from pathlib import Path


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_pdf(path: str) -> dict:
    raw_text = ""
    clean_text = ""
    diagnostics = {"warnings": []}
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(path)
        raw_text = ""
        for page in doc:
            raw_text += page.get_text()
        doc.close()
        clean_text = _normalize(raw_text)
    except Exception as e:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "pdf_error",
            "error_message": str(e),
            "diagnostics": {"error": str(e)},
        }
    return {"raw_text": raw_text, "clean_text": clean_text, "diagnostics": diagnostics}
