import re
from pathlib import Path


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_audio(path: str) -> dict:
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
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(str(p), fp16=False)
        raw_text = result.get("text", "")
        clean_text = _normalize(raw_text)
        return {"raw_text": raw_text, "clean_text": clean_text, "diagnostics": {}}
    except ImportError:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "whisper_not_available",
            "error_message": "Whisper not installed. Install openai-whisper for audio transcription.",
            "diagnostics": {},
        }
    except Exception as e:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "transcribe_error",
            "error_message": str(e),
            "diagnostics": {},
        }
