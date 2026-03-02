"""
Confronto modelli LLM per argument mining su trascrizione.
Esegue più modelli in parallelo e ritorna output + metriche + vincitore.
"""

from __future__ import annotations

import json
import logging
import os
import re
import asyncio
import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from app.services.transcripts.debate_transcriber import OPENROUTER_API_KEY as FALLBACK_OPENROUTER_API_KEY

logger = logging.getLogger(__name__)

CACHE_VERSION = "llm-compare-v2"
STRICT_MIN_CLAIMS_DEFAULT = 8
STRICT_MIN_DISAGREEMENTS_DEFAULT = 2
REPAIR_MODEL_INPUT_PER_M = 0.15
REPAIR_MODEL_OUTPUT_PER_M = 0.60

VALID_STANCES = {"pro", "contra", "neutral"}
STANCE_ALIASES = {
    "pro": "pro",
    "support": "pro",
    "supports": "pro",
    "agree": "pro",
    "agrees": "pro",
    "for": "pro",
    "favorevole": "pro",
    "yes": "pro",
    "contra": "contra",
    "contro": "contra",
    "against": "contra",
    "oppose": "contra",
    "opposes": "contra",
    "disagree": "contra",
    "disagrees": "contra",
    "anti": "contra",
    "false": "contra",
    "neutral": "neutral",
    "mixed": "neutral",
    "unclear": "neutral",
    "unknown": "neutral",
    "n/a": "neutral",
}


@dataclass(frozen=True)
class ModelSpec:
    model: str
    label: str
    input_per_m: float
    output_per_m: float


MODEL_SPECS: List[ModelSpec] = [
    ModelSpec(
        model="google/gemini-2.0-flash-lite-001",
        label="Gemini 2.0 Flash Lite",
        input_per_m=0.075,
        output_per_m=0.30,
    ),
    ModelSpec(
        model="google/gemini-2.5-flash-lite",
        label="Gemini 2.5 Flash Lite",
        input_per_m=0.10,
        output_per_m=0.40,
    ),
    ModelSpec(
        model="google/gemini-2.5-flash-lite-preview-09-2025",
        label="Gemini 2.5 Flash Lite (preview)",
        input_per_m=0.10,
        output_per_m=0.40,
    ),
]

SYSTEM_PROMPT = (
    "You are an argument-mining engine.\n"
    "Return ONLY valid JSON. No markdown, no commentary."
)

USER_PROMPT_TEMPLATE = """Analyze the debate transcript and return structured argument map.

Rules:
- Keep speaker ids exactly as in transcript.
- Keep timestamps in seconds (float).
- Claims must be concrete and falsifiable.
- stance must be one of: pro, contra, neutral.
- evidence_quote must be short and must appear verbatim in transcript.
- Output compactly: max 8 topics, max 14 claims, max 8 disagreements.

Schema:
{{
  "topics": [{{"name": "string", "summary": "string"}}],
  "claims": [
    {{
      "speaker": "string",
      "timestamp_s": 0.0,
      "topic": "string",
      "stance": "pro|contra|neutral",
      "claim": "string",
      "evidence_quote": "string"
    }}
  ],
  "disagreements": [
    {{
      "topic": "string",
      "speaker_a": "string",
      "speaker_b": "string",
      "timestamp_s": 0.0,
      "reason": "string"
    }}
  ]
}}

Transcript:
{transcript}
"""


def _get_openrouter_key() -> str:
    env = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    if env:
        return env
    return FALLBACK_OPENROUTER_API_KEY


def _cache_dir() -> Path:
    # backend/.cache/llm_compare
    d = Path(__file__).resolve().parents[3] / ".cache" / "llm_compare"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _sha256(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def _cache_key(
    transcript_excerpt: str,
    grounding_min_ratio: float,
    max_tokens: int,
    strict_benchmark: bool,
    strict_min_claims: int,
    strict_min_disagreements: int,
) -> str:
    signature = {
        "cache_version": CACHE_VERSION,
        "system_prompt": SYSTEM_PROMPT,
        "user_prompt": USER_PROMPT_TEMPLATE,
        "models": [s.model for s in MODEL_SPECS],
        "grounding_min_ratio": round(float(grounding_min_ratio), 4),
        "max_tokens": int(max_tokens),
        "strict_benchmark": bool(strict_benchmark),
        "strict_min_claims": int(strict_min_claims),
        "strict_min_disagreements": int(strict_min_disagreements),
        "excerpt_hash": _sha256(transcript_excerpt),
    }
    raw = json.dumps(signature, sort_keys=True, ensure_ascii=False)
    return _sha256(raw)


def _load_cached_result(cache_key: str) -> Optional[Dict[str, Any]]:
    p = _cache_dir() / f"{cache_key}.json"
    if not p.exists():
        return None
    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(obj, dict) and obj.get("status") == "ok":
            return obj
    except Exception:
        logger.warning("Invalid compare cache file: %s", p)
    return None


def _save_cached_result(cache_key: str, payload: Dict[str, Any]) -> None:
    p = _cache_dir() / f"{cache_key}.json"
    try:
        p.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning("Failed to save compare cache %s: %s", p, e)


def _extract_json_obj(content: str) -> Dict[str, Any]:
    text = (content or "").strip()
    if not text:
        raise ValueError("empty content")
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = text.removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _remove_trailing_commas(text: str) -> str:
    # Turns `{ "a": 1, }` into `{ "a": 1 }` and same for arrays.
    return re.sub(r",\s*([}\]])", r"\1", text)


def _escape_control_chars_in_json_strings(text: str) -> str:
    """
    Repairs common invalid JSON pattern from LLMs:
    newline/tab chars directly inside JSON strings.
    """
    out: List[str] = []
    in_string = False
    escaped = False
    for ch in text:
        if in_string:
            if escaped:
                out.append(ch)
                escaped = False
                continue
            if ch == "\\":
                out.append(ch)
                escaped = True
                continue
            if ch == '"':
                out.append(ch)
                in_string = False
                continue
            if ch == "\n":
                out.append("\\n")
                continue
            if ch == "\r":
                # Ignore CR while inside string.
                continue
            if ch == "\t":
                out.append("\\t")
                continue
            out.append(ch)
            continue

        if ch == '"':
            in_string = True
        out.append(ch)
    return "".join(out)


def _extract_json_candidates(content: str) -> List[str]:
    text = (content or "").strip()
    if not text:
        return []

    cleaned = text
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = cleaned.removesuffix("```").strip()

    cleaned = cleaned.replace("\ufeff", "").strip()
    candidates: List[str] = [cleaned]

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        obj_slice = cleaned[start : end + 1]
        candidates.append(obj_slice)

    enriched: List[str] = []
    for c in candidates:
        enriched.append(c)
        enriched.append(_remove_trailing_commas(c))
        enriched.append(_escape_control_chars_in_json_strings(c))
        enriched.append(_remove_trailing_commas(_escape_control_chars_in_json_strings(c)))

    uniq: List[str] = []
    seen = set()
    for c in enriched:
        key = c.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        uniq.append(key)
    return uniq


def _extract_json_obj_resilient(content: str) -> Dict[str, Any]:
    last_err: Optional[Exception] = None
    for candidate in _extract_json_candidates(content):
        try:
            return json.loads(candidate)
        except Exception as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    raise ValueError("empty content")


async def _repair_json_with_model(
    client: AsyncOpenAI,
    broken_output: str,
    max_tokens: int = 900,
) -> tuple[Dict[str, Any], Dict[str, Any]]:
    repair_system = (
        "You repair malformed JSON. "
        "Return ONLY valid JSON object with keys topics, claims, disagreements. "
        "Do not add markdown."
    )
    repair_user = (
        "Fix the JSON below so it becomes valid JSON object.\n"
        "Preserve original meaning and content as much as possible.\n"
        "If a value cannot be recovered, keep an empty string or empty list.\n\n"
        "Malformed JSON:\n"
        f"{broken_output[:50000]}"
    )
    resp = await client.chat.completions.create(
        model="openai/gpt-4o-mini",
        temperature=0,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": repair_system},
            {"role": "user", "content": repair_user},
        ],
    )
    repair_usage = {"prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0}
    u = resp.usage
    if u:
        repair_usage["prompt_tokens"] = int(getattr(u, "prompt_tokens", 0) or 0)
        repair_usage["completion_tokens"] = int(getattr(u, "completion_tokens", 0) or 0)
        repair_usage["cost_usd"] = (
            repair_usage["prompt_tokens"] * (REPAIR_MODEL_INPUT_PER_M / 1_000_000.0)
            + repair_usage["completion_tokens"] * (REPAIR_MODEL_OUTPUT_PER_M / 1_000_000.0)
        )
    repaired_content = (resp.choices[0].message.content or "").strip()
    return _extract_json_obj_resilient(repaired_content), repair_usage


def _normalize_output(obj: Dict[str, Any]) -> Dict[str, Any]:
    topics = obj.get("topics")
    claims = obj.get("claims")
    disagreements = obj.get("disagreements")
    return {
        "topics": topics if isinstance(topics, list) else [],
        "claims": claims if isinstance(claims, list) else [],
        "disagreements": disagreements if isinstance(disagreements, list) else [],
    }


def _to_float_timestamp(raw: Any, fallback: float = 0.0) -> float:
    if isinstance(raw, (int, float)):
        return max(0.0, min(20000.0, float(raw)))
    s = str(raw or "").strip()
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    if m:
        try:
            return max(0.0, min(20000.0, float(m.group(0))))
        except Exception:
            pass
    return max(0.0, min(20000.0, float(fallback)))


def _normalize_stance(raw: Any) -> str:
    s = str(raw or "").strip().lower()
    if s in VALID_STANCES:
        return s
    if s in STANCE_ALIASES:
        return STANCE_ALIASES[s]
    for k, v in STANCE_ALIASES.items():
        if k and k in s:
            return v
    return "neutral"


def _best_grounded_quote(seed_text: str, transcript_excerpt: str) -> str:
    tx = transcript_excerpt or ""
    if not tx:
        return ""
    tx_lower = tx.lower()

    words = sorted(
        set(re.findall(r"[a-zA-Z0-9][a-zA-Z0-9'/-]{2,}", (seed_text or "").lower())),
        key=len,
        reverse=True,
    )
    for w in words:
        if len(w) < 4:
            continue
        idx = tx_lower.find(w)
        if idx < 0:
            continue
        start = max(0, idx - 40)
        end = min(len(tx), idx + 110)
        snippet = tx[start:end].strip()
        if len(snippet) >= 6:
            return snippet

    lines = [ln.strip() for ln in tx.splitlines() if ln.strip()]
    if lines:
        line = lines[0]
        return line[:140].strip()
    return tx[:140].strip()


def _auto_fix_output(output: Dict[str, Any], transcript_excerpt: str) -> tuple[Dict[str, Any], List[str]]:
    notes: List[str] = []
    tx_lower = (transcript_excerpt or "").lower()

    raw_topics = output.get("topics", [])
    raw_claims = output.get("claims", [])
    raw_disagreements = output.get("disagreements", [])

    topics_fixed: List[Dict[str, Any]] = []
    for t in raw_topics:
        if not isinstance(t, dict):
            continue
        name = str(t.get("name", "")).strip()
        if not name:
            continue
        topics_fixed.append(
            {
                "name": name[:80],
                "summary": str(t.get("summary", "")).strip()[:280],
            }
        )
        if len(topics_fixed) >= 8:
            break

    claims_fixed: List[Dict[str, Any]] = []
    for i, c in enumerate(raw_claims):
        if not isinstance(c, dict):
            continue
        speaker = str(c.get("speaker", "")).strip() or "?"
        topic = str(c.get("topic", "")).strip() or "general"
        claim = str(c.get("claim", "")).strip()
        stance = _normalize_stance(c.get("stance"))
        ts = _to_float_timestamp(c.get("timestamp_s"), fallback=float(i))
        quote = str(c.get("evidence_quote", "")).strip()

        if c.get("stance") != stance:
            notes.append("stance_normalized")
        if (len(quote) < 6) or (quote.lower() not in tx_lower):
            replacement = _best_grounded_quote(claim or topic, transcript_excerpt)
            if replacement and replacement.lower() in tx_lower and len(replacement) >= 6:
                quote = replacement
                notes.append("quote_grounded")

        claims_fixed.append(
            {
                "speaker": speaker[:48],
                "timestamp_s": ts,
                "topic": topic[:80],
                "stance": stance,
                "claim": claim[:360],
                "evidence_quote": quote[:300],
            }
        )
        if len(claims_fixed) >= 14:
            break

    claims_sorted = sorted(claims_fixed, key=lambda x: x.get("timestamp_s", 0.0))
    if [c.get("timestamp_s") for c in claims_fixed] != [c.get("timestamp_s") for c in claims_sorted]:
        notes.append("timeline_sorted_claims")
    claims_fixed = claims_sorted

    if not topics_fixed and claims_fixed:
        seen = set()
        for c in claims_fixed:
            topic = str(c.get("topic", "")).strip()
            key = topic.lower()
            if not topic or key in seen:
                continue
            seen.add(key)
            topics_fixed.append({"name": topic[:80], "summary": ""})
            if len(topics_fixed) >= 8:
                break
        if topics_fixed:
            notes.append("topics_derived_from_claims")

    disagreements_fixed: List[Dict[str, Any]] = []
    for i, d in enumerate(raw_disagreements):
        if not isinstance(d, dict):
            continue
        disagreements_fixed.append(
            {
                "topic": (str(d.get("topic", "")).strip() or "general")[:80],
                "speaker_a": (str(d.get("speaker_a", "")).strip() or "?")[:48],
                "speaker_b": (str(d.get("speaker_b", "")).strip() or "?")[:48],
                "timestamp_s": _to_float_timestamp(d.get("timestamp_s"), fallback=float(i)),
                "reason": str(d.get("reason", "")).strip()[:260],
            }
        )
        if len(disagreements_fixed) >= 8:
            break

    disagreements_sorted = sorted(disagreements_fixed, key=lambda x: x.get("timestamp_s", 0.0))
    if [d.get("timestamp_s") for d in disagreements_fixed] != [d.get("timestamp_s") for d in disagreements_sorted]:
        notes.append("timeline_sorted_disagreements")

    fixed = {
        "topics": topics_fixed,
        "claims": claims_fixed,
        "disagreements": disagreements_sorted,
    }
    return fixed, sorted(set(notes))


def _validate_output(
    output: Dict[str, Any],
    transcript_excerpt: str,
    grounding_min_ratio: float = 0.6,
) -> Dict[str, Any]:
    topics = output["topics"]
    claims = output["claims"]
    disagreements = output["disagreements"]

    speakers = set()
    stance_ok = True
    ts_ok = True
    claim_ts: List[float] = []
    dis_ts: List[float] = []

    for c in claims:
        if not isinstance(c, dict):
            stance_ok = False
            ts_ok = False
            continue
        speakers.add(str(c.get("speaker", "")).strip())
        if c.get("stance") not in {"pro", "contra", "neutral"}:
            stance_ok = False
        ts = c.get("timestamp_s")
        if not isinstance(ts, (int, float)) or ts < 0 or ts > 20000:
            ts_ok = False
        else:
            claim_ts.append(float(ts))

    for d in disagreements:
        if not isinstance(d, dict):
            ts_ok = False
            continue
        ts = d.get("timestamp_s")
        if not isinstance(ts, (int, float)) or ts < 0 or ts > 20000:
            ts_ok = False
        else:
            dis_ts.append(float(ts))

    chronological_ok = (claim_ts == sorted(claim_ts)) and (dis_ts == sorted(dis_ts))

    excerpt_lower = transcript_excerpt.lower()
    quote_count = 0
    quote_hits = 0
    for c in claims:
        if not isinstance(c, dict):
            continue
        q = str(c.get("evidence_quote", "")).strip()
        if len(q) < 6:
            continue
        quote_count += 1
        if q.lower() in excerpt_lower:
            quote_hits += 1
    quote_grounding_ratio = (quote_hits / quote_count) if quote_count else 0.0

    speaker_cov = len(speakers) >= 2

    score = 0
    if len(topics) >= 3:
        score += 20
    if len(claims) >= 8:
        score += 20
    if len(disagreements) >= 2:
        score += 15
    if speaker_cov:
        score += 15
    if stance_ok and ts_ok:
        score += 10
    if chronological_ok:
        score += 10
    if quote_count >= 5 and quote_grounding_ratio >= grounding_min_ratio:
        score += 10

    hard_fail_reasons = []
    if not speaker_cov:
        hard_fail_reasons.append("speaker coverage missing")
    if not stance_ok:
        hard_fail_reasons.append("invalid stance values")
    if not ts_ok:
        hard_fail_reasons.append("invalid timestamps")
    if not chronological_ok:
        hard_fail_reasons.append("non-monotonic timeline")
    if quote_count < 5:
        hard_fail_reasons.append("too few grounded quotes")
    if quote_grounding_ratio < grounding_min_ratio:
        hard_fail_reasons.append("low quote grounding")

    return {
        "score": score,
        "speaker_cov": speaker_cov,
        "stance_ok": stance_ok,
        "ts_ok": ts_ok,
        "chronological_ok": chronological_ok,
        "quote_grounding_ratio": quote_grounding_ratio,
        "quote_count": quote_count,
        "hard_fail_reasons": hard_fail_reasons,
        "topics_count": len(topics),
        "claims_count": len(claims),
        "disagreements_count": len(disagreements),
    }


async def _call_model(
    client: AsyncOpenAI,
    spec: ModelSpec,
    transcript_excerpt: str,
    grounding_min_ratio: float,
    max_tokens: int,
    strict_benchmark: bool,
    strict_min_claims: int,
    strict_min_disagreements: int,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "model": spec.model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(transcript=transcript_excerpt)},
        ],
        "temperature": 0,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
    }

    usage = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "cost_usd": 0.0,
        "repair_prompt_tokens": 0,
        "repair_completion_tokens": 0,
        "repair_cost_usd": 0.0,
        "total_cost_usd": 0.0,
    }
    try:
        try:
            resp = await client.chat.completions.create(**payload)
        except Exception as e:
            msg = str(e).lower()
            if (
                "response_format" in msg
                or ("json mode" in msg and "not supported" in msg)
                or ("invalidparameter" in msg and "json mode" in msg)
            ):
                payload.pop("response_format", None)
                resp = await client.chat.completions.create(**payload)
            else:
                raise

        u = resp.usage
        if u:
            usage["prompt_tokens"] += int(getattr(u, "prompt_tokens", 0) or 0)
            usage["completion_tokens"] += int(getattr(u, "completion_tokens", 0) or 0)
            usage["cost_usd"] += (
                int(getattr(u, "prompt_tokens", 0) or 0) * (spec.input_per_m / 1_000_000.0)
                + int(getattr(u, "completion_tokens", 0) or 0) * (spec.output_per_m / 1_000_000.0)
            )
            usage["total_cost_usd"] = usage["cost_usd"]

        content = (resp.choices[0].message.content or "").strip()
        parse_mode = "direct"
        repair_usage = {"prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0}
        try:
            parsed = _extract_json_obj_resilient(content)
        except Exception:
            if strict_benchmark:
                # Strict mode retry: ask the same model once more for JSON-only output.
                strict_retry_payload = dict(payload)
                strict_retry_payload["messages"] = [
                    {
                        "role": "system",
                        "content": (
                            SYSTEM_PROMPT
                            + "\nSTRICT MODE: Return a single valid JSON object only. "
                            + "No markdown, no prose, no code fences."
                        ),
                    },
                    {
                        "role": "user",
                        "content": USER_PROMPT_TEMPLATE.format(transcript=transcript_excerpt)
                        + "\n\nIMPORTANT: Output must be a valid JSON object, nothing else.",
                    },
                ]
                resp_retry = await client.chat.completions.create(**strict_retry_payload)
                u2 = resp_retry.usage
                if u2:
                    usage["prompt_tokens"] += int(getattr(u2, "prompt_tokens", 0) or 0)
                    usage["completion_tokens"] += int(getattr(u2, "completion_tokens", 0) or 0)
                    usage["cost_usd"] += (
                        int(getattr(u2, "prompt_tokens", 0) or 0) * (spec.input_per_m / 1_000_000.0)
                        + int(getattr(u2, "completion_tokens", 0) or 0) * (spec.output_per_m / 1_000_000.0)
                    )
                    usage["total_cost_usd"] = usage["cost_usd"] + usage["repair_cost_usd"]
                retry_content = (resp_retry.choices[0].message.content or "").strip()
                try:
                    parsed = _extract_json_obj_resilient(retry_content)
                    parse_mode = "direct+retry"
                except Exception:
                    raise ValueError("invalid JSON output (strict benchmark: repair disabled)")
            # Last-resort repair: converts malformed JSON to valid JSON.
            else:
                parsed, repair_usage = await _repair_json_with_model(client, content)
                parse_mode = "repaired"
        usage["repair_prompt_tokens"] = repair_usage["prompt_tokens"]
        usage["repair_completion_tokens"] = repair_usage["completion_tokens"]
        usage["repair_cost_usd"] = repair_usage["cost_usd"]
        usage["total_cost_usd"] = usage["cost_usd"] + usage["repair_cost_usd"]

        normalized = _normalize_output(parsed)
        if not strict_benchmark:
            normalized, fix_notes = _auto_fix_output(normalized, transcript_excerpt)
            if fix_notes:
                parse_mode = f"{parse_mode}+autofix"
        metrics = _validate_output(normalized, transcript_excerpt, grounding_min_ratio=grounding_min_ratio)
        if strict_benchmark:
            if metrics["claims_count"] < strict_min_claims:
                metrics["hard_fail_reasons"].append(
                    f"too few claims for strict benchmark (min {strict_min_claims})"
                )
            if metrics["disagreements_count"] < strict_min_disagreements:
                metrics["hard_fail_reasons"].append(
                    f"too few disagreements for strict benchmark (min {strict_min_disagreements})"
                )
            metrics["hard_fail_reasons"] = sorted(set(metrics["hard_fail_reasons"]))

        ok = len(metrics["hard_fail_reasons"]) == 0
        return {
            "model": spec.model,
            "label": spec.label,
            "ok": ok,
            "error": None if ok else "hard validation failed: " + ", ".join(metrics["hard_fail_reasons"]),
            "metrics": metrics,
            "usage": usage,
            "output": normalized,
            "parse_mode": parse_mode,
        }
    except Exception as e:
        logger.exception("Model compare failed for %s", spec.model)
        return {
            "model": spec.model,
            "label": spec.label,
            "ok": False,
            "error": str(e),
            "metrics": {
                "score": 0,
                "speaker_cov": False,
                "stance_ok": False,
                "ts_ok": False,
                "chronological_ok": False,
                "quote_grounding_ratio": 0.0,
                "quote_count": 0,
                "hard_fail_reasons": ["runtime failure"],
                "topics_count": 0,
                "claims_count": 0,
                "disagreements_count": 0,
            },
            "usage": usage,
            "output": {"topics": [], "claims": [], "disagreements": []},
            "parse_mode": "failed",
        }


def _pick_winner(results: List[Dict[str, Any]]) -> Optional[str]:
    if not results:
        return None
    ranked = sorted(
        results,
        key=lambda r: (
            1 if r["ok"] else 0,
            float(r["metrics"]["score"]),
            float(r["metrics"]["quote_grounding_ratio"]),
            -float(r["usage"].get("total_cost_usd", r["usage"].get("cost_usd", 0.0))),
        ),
        reverse=True,
    )
    top = ranked[0]
    if not top["ok"]:
        return None
    return top["model"]


async def compare_debate_models(
    transcript: str,
    excerpt_chars: int = 8000,
    grounding_min_ratio: float = 0.6,
    max_tokens: int = 500,
    force_refresh: bool = False,
    strict_benchmark: bool = False,
    strict_min_claims: int = STRICT_MIN_CLAIMS_DEFAULT,
    strict_min_disagreements: int = STRICT_MIN_DISAGREEMENTS_DEFAULT,
) -> Dict[str, Any]:
    tx = (transcript or "").strip()
    if len(tx) < 120:
        raise ValueError("Trascrizione troppo corta per confronto modelli")

    excerpt = tx[: max(1000, int(excerpt_chars))]
    effective_max_tokens = max_tokens
    if strict_benchmark:
        # In strict mode, avoid frequent JSON truncation at low token caps.
        effective_max_tokens = max(int(max_tokens), 700)
    cache_key = _cache_key(
        transcript_excerpt=excerpt,
        grounding_min_ratio=grounding_min_ratio,
        max_tokens=effective_max_tokens,
        strict_benchmark=strict_benchmark,
        strict_min_claims=strict_min_claims,
        strict_min_disagreements=strict_min_disagreements,
    )
    if not force_refresh:
        cached = _load_cached_result(cache_key)
        if cached is not None:
            cached["from_cache"] = True
            cached["cache_key"] = cache_key
            return cached

    key = _get_openrouter_key()
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY mancante")

    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key,
        timeout=140.0,
    )

    tasks = [
        _call_model(
            client=client,
            spec=spec,
            transcript_excerpt=excerpt,
            grounding_min_ratio=grounding_min_ratio,
            max_tokens=effective_max_tokens,
            strict_benchmark=strict_benchmark,
            strict_min_claims=strict_min_claims,
            strict_min_disagreements=strict_min_disagreements,
        )
        for spec in MODEL_SPECS
    ]
    results = await asyncio.gather(*tasks)
    winner_model = _pick_winner(results)
    winner_label = None
    if winner_model:
        for r in results:
            if r["model"] == winner_model:
                winner_label = r["label"]
                break

    payload = {
        "status": "ok",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "winner_model": winner_model,
        "winner_label": winner_label,
        "excerpt_chars": len(excerpt),
        "grounding_min_ratio": grounding_min_ratio,
        "max_tokens": effective_max_tokens,
        "strict_benchmark": strict_benchmark,
        "strict_min_claims": strict_min_claims,
        "strict_min_disagreements": strict_min_disagreements,
        "results": results,
        "from_cache": False,
        "cache_key": cache_key,
    }
    _save_cached_result(cache_key, payload)
    return payload

