"""
API YouTube: trascrizione PRO (debate) in background.
POST /api/youtube/transcript → { job_id } oppure { error } (sempre 200)
GET /api/youtube/transcript/status/{job_id} → status, transcript?, error?
POST /api/youtube/cache/clear → reset cache trascrizioni
"""

import traceback
import uuid
import shutil
import logging
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, Body, Depends
from app import schemas, crud
from app.api.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])
logger = logging.getLogger(__name__)

_job_store: dict = {}


def _run_transcript_job(job_id: str, url: str, speakers: int, language_code: str | None = None, force_refresh: bool = False, use_assembly: bool = False) -> None:
    import asyncio

    def progress_callback(stage: str, message: str) -> None:
        if job_id in _job_store:
            _job_store[job_id]["stage"] = stage
            _job_store[job_id]["message"] = message

    try:
        from app.services.transcripts.debate_transcriber import get_youtube_transcript
        transcript, info, from_cache = asyncio.run(
            get_youtube_transcript(url, speakers=speakers or 2, language_code=language_code, force_refresh=force_refresh, use_assembly=use_assembly, progress_callback=progress_callback)
        )
        _job_store[job_id]["status"] = "ready"
        _job_store[job_id]["transcript"] = transcript
        _job_store[job_id]["title"] = info.get("title")
        _job_store[job_id]["stage"] = "done"
        _job_store[job_id]["message"] = "Completato"
        _job_store[job_id]["from_cache"] = from_cache
    except ImportError as e:
        logger.exception("Transcript dependencies missing")
        _job_store[job_id]["status"] = "failed"
        _job_store[job_id]["error"] = f"Dipendenze mancanti: pip install assemblyai openai aiofiles. Dettaglio: {e}"
    except Exception as e:
        logger.exception("Transcript job %s failed", job_id)
        _job_store[job_id]["status"] = "failed"
        _job_store[job_id]["error"] = str(e)[:500]


def _is_youtube_url(url: str) -> bool:
    u = (url or "").strip()
    return "youtube.com" in u or "youtu.be" in u


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"1", "true", "yes", "y", "on"}:
            return True
        if v in {"0", "false", "no", "n", "off"}:
            return False
    return default


@router.post("/transcript")
async def start_transcript(
    background_tasks: BackgroundTasks,
    body: dict[str, Any] | None = Body(None),
):
    """Sempre 200: body con job_id oppure error."""
    try:
        b = body or {}
        url = (b.get("url") or "").strip()
        speakers = b.get("speakers", 2)
        language = (b.get("language") or "").strip().lower() or None
        if language and language != "auto":
            language_code = language if language in ("it", "en") else None
        else:
            language_code = None
        if not url or not _is_youtube_url(url):
            return {"job_id": None, "error": "URL non è YouTube valido"}
        try:
            speakers = int(speakers) if speakers is not None else 2
        except (TypeError, ValueError):
            speakers = 2
        job_id = str(uuid.uuid4())
        _job_store[job_id] = {
            "status": "processing",
            "transcript": None,
            "error": None,
            "title": None,
            "stage": "info",
            "message": "Avvio…",
            "from_cache": False,
        }
        force_refresh = _as_bool(b.get("force_refresh"), default=False)
        use_assembly = _as_bool(b.get("use_assembly"), default=False)
        background_tasks.add_task(_run_transcript_job, job_id, url, speakers, language_code, force_refresh, use_assembly)
        return {"job_id": job_id}
    except BaseException as e:
        logger.exception("POST /transcript failed")
        return {
            "job_id": None,
            "error": str(e),
            "traceback": "".join(traceback.format_exception(type(e), e, e.__traceback__)),
        }


@router.post("/cache/clear")
def clear_transcript_cache():
    """Elimina cache trascrizioni e file audio scaricati (per reset completo)."""
    try:
        cache_dir = Path(".cache")
        downloads_dir = Path("downloads")
        removed = 0
        for d in [cache_dir, downloads_dir]:
            if d.exists():
                for f in d.glob("*"):
                    try:
                        if f.is_file():
                            f.unlink()
                            removed += 1
                        elif f.is_dir():
                            shutil.rmtree(f, ignore_errors=True)
                            removed += 1
                    except OSError:
                        pass
        return {"ok": True, "removed": removed}
    except Exception as e:
        logger.exception("Cache clear failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcript/status/{job_id}")
def get_transcript_status(job_id: str):
    if job_id not in _job_store:
        raise HTTPException(status_code=404, detail="Job non trovato")
    row = _job_store[job_id]
    return {
        "job_id": job_id,
        "status": row["status"],
        "transcript": row.get("transcript"),
        "error": row.get("error"),
        "title": row.get("title"),
        "stage": row.get("stage"),
        "message": row.get("message"),
        "from_cache": row.get("from_cache", False),
    }


@router.post("/debate/compare")
async def compare_debate_models(body: dict[str, Any] | None = Body(None)):
    """
    Confronta più modelli LLM sulla stessa trascrizione e ritorna
    output + metriche + vincitore.
    """
    try:
        b = body or {}
        raw_transcript = b.get("transcript")
        if isinstance(raw_transcript, str):
            transcript = raw_transcript.strip()
        elif raw_transcript is None:
            transcript = ""
        else:
            transcript = str(raw_transcript).strip()
        if len(transcript) < 120:
            return {"status": "error", "error": "Trascrizione troppo corta per il confronto"}

        try:
            excerpt_chars = int(b.get("excerpt_chars") or 8000)
        except (TypeError, ValueError):
            excerpt_chars = 8000
        excerpt_chars = max(1000, min(excerpt_chars, 60000))

        try:
            grounding_min_ratio = float(b.get("grounding_min_ratio") or 0.6)
        except (TypeError, ValueError):
            grounding_min_ratio = 0.6
        grounding_min_ratio = max(0.1, min(grounding_min_ratio, 1.0))

        try:
            max_tokens = int(b.get("max_tokens") or 500)
        except (TypeError, ValueError):
            max_tokens = 500
        max_tokens = max(250, min(max_tokens, 2000))

        force_refresh = _as_bool(b.get("force_refresh", False), default=False)
        strict_benchmark = _as_bool(b.get("strict_benchmark", False), default=False)

        try:
            strict_min_claims = int(b.get("strict_min_claims") or 8)
        except (TypeError, ValueError):
            strict_min_claims = 8
        strict_min_claims = max(1, min(strict_min_claims, 40))

        try:
            strict_min_disagreements = int(b.get("strict_min_disagreements") or 2)
        except (TypeError, ValueError):
            strict_min_disagreements = 2
        strict_min_disagreements = max(0, min(strict_min_disagreements, 20))

        from app.services.transcripts.debate_compare import compare_debate_models as _compare

        return await _compare(
            transcript=transcript,
            excerpt_chars=excerpt_chars,
            grounding_min_ratio=grounding_min_ratio,
            max_tokens=max_tokens,
            force_refresh=force_refresh,
            strict_benchmark=strict_benchmark,
            strict_min_claims=strict_min_claims,
            strict_min_disagreements=strict_min_disagreements,
        )
    except Exception as e:
        logger.exception("POST /debate/compare failed")
        return {
            "status": "error",
            "error": str(e),
            "traceback": "".join(traceback.format_exception(type(e), e, e.__traceback__)),
        }
