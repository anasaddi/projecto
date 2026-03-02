import argparse
import hashlib
import json
import os
import re
import sqlite3
import time
from pathlib import Path
from urllib import error, request


ROOT = Path(__file__).resolve().parents[1]
TRANSCRIBER_PATH = ROOT / "backend" / "app" / "services" / "transcripts" / "debate_transcriber.py"
TRANSCRIPT_PATH = ROOT / "backend" / ".cache" / "XtxFdX7yIAs_transcript.txt"
DEFAULT_DB_PATH = ROOT / "benchmark_openrouter_history.db"
DEFAULT_RESULTS_PATH = ROOT / "benchmark_openrouter_results.json"
PROMPT_VERSION_BASE = "debate-json-compact-v3"

TOPIC_KEYWORDS = {
    "quran",
    "jesus",
    "disciple",
    "disciples",
    "follower",
    "followers",
    "bible",
    "messiah",
}


def read_openrouter_key() -> str:
    env_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    if env_key:
        return env_key

    text = TRANSCRIBER_PATH.read_text(encoding="utf-8")
    m = re.search(r'OPENROUTER_API_KEY\s*=\s*"([^"]+)"', text)
    if not m:
        raise RuntimeError("OPENROUTER_API_KEY not found in debate_transcriber.py")
    return m.group(1).strip()


def load_transcript_excerpt(max_chars: int) -> str:
    text = TRANSCRIPT_PATH.read_text(encoding="utf-8")
    return text[:max_chars]


def transcript_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def post_json(url: str, payload: dict, api_key: str) -> dict:
    data = json.dumps(payload).encode("utf-8")
    last_exc: Exception | None = None
    for attempt in range(1, 4):
        req = request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost",
                "X-Title": "KM Debate Benchmark DB",
            },
        )
        try:
            with request.urlopen(req, timeout=150) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            if attempt < 3 and e.code in (408, 409, 425, 429, 500, 502, 503, 504):
                time.sleep(1.5 * attempt)
                last_exc = e
                continue
            raise RuntimeError(f"HTTP {e.code}: {body[:800]}") from e
        except (error.URLError, TimeoutError, OSError) as e:
            last_exc = e
            if attempt < 3:
                time.sleep(1.5 * attempt)
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("Unknown network failure")


def get_models_catalog(api_key: str) -> list[dict]:
    req = request.Request(
        "https://openrouter.ai/api/v1/models",
        method="GET",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    with request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    catalog = []
    for m in payload.get("data", []):
        pricing = m.get("pricing", {}) or {}
        top_provider = m.get("top_provider", {}) or {}
        try:
            prompt_price = float(pricing.get("prompt", "0") or 0)
            completion_price = float(pricing.get("completion", "0") or 0)
        except Exception:
            prompt_price = 0.0
            completion_price = 0.0
        context_len = m.get("context_length") or top_provider.get("context_length") or 0
        try:
            context_len = int(context_len)
        except Exception:
            context_len = 0
        catalog.append(
            {
                "id": m.get("id", ""),
                "name": m.get("name", "") or "",
                "description": (m.get("description", "") or ""),
                "prompt_price": prompt_price,
                "completion_price": completion_price,
                "context_length": context_len,
            }
        )
    return catalog


def build_messages(excerpt: str, hard_mode: bool = False) -> list[dict]:
    system = (
        "You are an argument-mining engine. Return ONLY a valid JSON object. "
        "No markdown, no prose."
    )
    hard_rules = ""
    if hard_mode:
        hard_rules = (
            "- HARD MODE: every evidence_quote must be an exact short substring from transcript\n"
            "- HARD MODE: timestamps in claims/disagreements must be chronologically non-decreasing\n"
            "- HARD MODE: avoid generic claims; each claim must be falsifiable and concrete\n"
        )
    user = (
        "Analyze this debate transcript excerpt and extract a compact structured map.\n"
        "Rules:\n"
        "- Use speaker ids exactly as seen (A, B, etc.)\n"
        "- Keep timestamps in seconds (float)\n"
        "- Claims must be concise and specific\n"
        "- Use stance values only: pro, contra, neutral\n"
        "- For disagreements, include only explicit disagreement moments\n"
        "- Keep output compact: max 6 topics, max 12 claims, max 6 disagreements\n"
        "- evidence_quote max 20 words\n\n"
        f"{hard_rules}\n"
        "Return JSON with exact schema:\n"
        "{\n"
        '  "topics": [{"name": "string", "summary": "string"}],\n'
        '  "claims": [{"speaker": "string", "timestamp_s": 0.0, "topic": "string", "stance": "pro|contra|neutral", "claim": "string", "evidence_quote": "string"}],\n'
        '  "disagreements": [{"topic": "string", "speaker_a": "string", "speaker_b": "string", "timestamp_s": 0.0, "reason": "string"}]\n'
        "}\n\n"
        f"Transcript:\n{excerpt}"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def _remove_trailing_commas(text: str) -> str:
    return re.sub(r",\s*([}\]])", r"\1", text)


def _escape_control_chars_in_json_strings(text: str) -> str:
    out = []
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


def _json_candidates(content: str) -> list[str]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = cleaned.removesuffix("```").strip()
    cleaned = cleaned.replace("\ufeff", "").strip()

    candidates = [cleaned]
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        candidates.append(cleaned[start : end + 1])

    enriched = []
    for c in candidates:
        enriched.append(c)
        enriched.append(_remove_trailing_commas(c))
        enriched.append(_escape_control_chars_in_json_strings(c))
        enriched.append(_remove_trailing_commas(_escape_control_chars_in_json_strings(c)))

    uniq = []
    seen = set()
    for c in enriched:
        key = c.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        uniq.append(key)
    return uniq


def _response_content(resp: dict) -> str:
    return (
        resp.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )


def _parse_json_candidates(content: str) -> dict:
    last_err = None
    for c in _json_candidates(content):
        try:
            return json.loads(c)
        except json.JSONDecodeError as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    raise ValueError("unable to parse JSON content")


def _repair_json_with_model(
    broken_content: str,
    api_key: str,
    prices: dict,
    repair_model: str,
    max_tokens: int = 900,
) -> tuple[dict, float]:
    messages = [
        {
            "role": "system",
            "content": (
                "Repair malformed JSON into a single valid JSON object. "
                "Return ONLY JSON, no markdown, no prose."
            ),
        },
        {
            "role": "user",
            "content": (
                "Repair this malformed JSON. Keep same schema/meaning where possible.\n\n"
                f"{broken_content}"
            ),
        },
    ]
    payload = {
        "model": repair_model,
        "messages": messages,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "max_tokens": max_tokens,
    }
    try:
        resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
    except Exception as e:
        msg = str(e).lower()
        if (
            "response_format" in msg
            or ("json mode" in msg and "not supported" in msg)
            or ("invalidparameter" in msg and "json mode" in msg)
        ):
            payload.pop("response_format", None)
            resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
        else:
            raise

    content = _response_content(resp)
    if not content:
        raise ValueError("repair model returned empty content")
    parsed = _parse_json_candidates(content)

    usage = resp.get("usage", {}) or {}
    pt = int(usage.get("prompt_tokens", 0) or 0)
    ct = int(usage.get("completion_tokens", 0) or 0)
    pp = prices.get(repair_model, {}).get("prompt_price", 0.0)
    cp = prices.get(repair_model, {}).get("completion_price", 0.0)
    repair_cost = pt * pp + ct * cp
    return parsed, repair_cost


def parse_response_content(resp: dict) -> dict:
    content = _response_content(resp)
    if not content:
        raise ValueError("empty content")

    return _parse_json_candidates(content)


def evaluate_output(
    obj: dict,
    excerpt: str,
    hard_mode: bool = False,
    grounding_min_ratio: float = 0.6,
) -> dict:
    topics = obj.get("topics", [])
    claims = obj.get("claims", [])
    disagreements = obj.get("disagreements", [])

    valid_lists = (
        isinstance(topics, list)
        and isinstance(claims, list)
        and isinstance(disagreements, list)
    )

    topic_names = [str(t.get("name", "")).lower() for t in topics if isinstance(t, dict)]
    topic_hit = any(any(k in tn for k in TOPIC_KEYWORDS) for tn in topic_names)

    speakers = {str(c.get("speaker", "")).strip() for c in claims if isinstance(c, dict)}
    speaker_cov = ("A" in speakers and "B" in speakers)

    stance_ok = True
    ts_ok = True
    claim_timestamps = []
    disagreement_timestamps = []
    for c in claims:
        if not isinstance(c, dict):
            stance_ok = False
            ts_ok = False
            continue
        if c.get("stance") not in {"pro", "contra", "neutral"}:
            stance_ok = False
        ts = c.get("timestamp_s")
        if not isinstance(ts, (int, float)) or ts < 0 or ts > 4000:
            ts_ok = False
        else:
            claim_timestamps.append(float(ts))

    for d in disagreements:
        if not isinstance(d, dict):
            ts_ok = False
            continue
        ts = d.get("timestamp_s")
        if not isinstance(ts, (int, float)) or ts < 0 or ts > 4000:
            ts_ok = False
        else:
            disagreement_timestamps.append(float(ts))

    chronological_ok = (
        claim_timestamps == sorted(claim_timestamps)
        and disagreement_timestamps == sorted(disagreement_timestamps)
    )

    excerpt_lower = excerpt.lower()
    quote_hits = 0
    quote_count = 0
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

    score = 0
    if hard_mode:
        if valid_lists:
            score += 15
        if len(topics) >= 3:
            score += 15
        if len(claims) >= 8:
            score += 15
        if len(disagreements) >= 2:
            score += 10
        if topic_hit:
            score += 10
        if speaker_cov:
            score += 10
        if stance_ok and ts_ok:
            score += 10
        if chronological_ok:
            score += 5
        if quote_count >= 5 and quote_grounding_ratio >= grounding_min_ratio:
            score += 10
    else:
        if valid_lists:
            score += 20
        if len(topics) >= 3:
            score += 20
        if len(claims) >= 8:
            score += 20
        if len(disagreements) >= 2:
            score += 15
        if topic_hit:
            score += 10
        if speaker_cov:
            score += 10
        if stance_ok and ts_ok:
            score += 5

    return {
        "score": score,
        "topics": len(topics),
        "claims": len(claims),
        "disagreements": len(disagreements),
        "topic_hit": topic_hit,
        "speaker_cov": speaker_cov,
        "stance_ok": stance_ok,
        "ts_ok": ts_ok,
        "chronological_ok": chronological_ok,
        "quote_grounding_ratio": quote_grounding_ratio,
        "quote_count": quote_count,
    }


def run_once(
    model: str,
    excerpt: str,
    api_key: str,
    prices: dict,
    hard_mode: bool = False,
    grounding_min_ratio: float = 0.6,
    max_tokens_override: int | None = None,
    enable_json_repair: bool = False,
    repair_model: str = "openai/gpt-4o-mini",
) -> dict:
    max_tokens = max_tokens_override if max_tokens_override and max_tokens_override > 0 else (1700 if hard_mode else 1200)
    payload = {
        "model": model,
        "messages": build_messages(excerpt, hard_mode=hard_mode),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "max_tokens": max_tokens,
    }
    started = time.time()
    try:
        resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
    except Exception as e:
        msg = str(e).lower()
        if (
            "response_format" in msg
            or ("json mode" in msg and "not supported" in msg)
            or ("invalidparameter" in msg and "json mode" in msg)
        ):
            payload.pop("response_format", None)
            resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
        else:
            raise
    elapsed = time.time() - started

    usage = resp.get("usage", {}) or {}
    pt = int(usage.get("prompt_tokens", 0) or 0)
    ct = int(usage.get("completion_tokens", 0) or 0)
    pp = prices.get(model, {}).get("prompt_price", 0.0)
    cp = prices.get(model, {}).get("completion_price", 0.0)
    cost = pt * pp + ct * cp

    parse_mode = "direct"
    try:
        parsed = parse_response_content(resp)
    except Exception:
        if not enable_json_repair:
            raise
        repaired, repair_cost = _repair_json_with_model(
            broken_content=_response_content(resp),
            api_key=api_key,
            prices=prices,
            repair_model=repair_model,
        )
        parsed = repaired
        cost += repair_cost
        parse_mode = f"repaired:{repair_model}"

    try:
        eval_result = evaluate_output(
            parsed,
            excerpt=excerpt,
            hard_mode=hard_mode,
            grounding_min_ratio=grounding_min_ratio,
        )
        ok = True
        err = None
        if hard_mode:
            hard_fail = []
            if not eval_result["speaker_cov"]:
                hard_fail.append("speaker coverage missing")
            if not eval_result["stance_ok"]:
                hard_fail.append("invalid stance labels")
            if not eval_result["ts_ok"]:
                hard_fail.append("invalid timestamps")
            if eval_result["quote_count"] < 5:
                hard_fail.append("too few grounded quotes")
            if eval_result["quote_grounding_ratio"] < grounding_min_ratio:
                hard_fail.append("low quote grounding")
            if not eval_result["chronological_ok"]:
                hard_fail.append("non-monotonic timeline")
            if hard_fail:
                ok = False
                err = "hard validation failed: " + ", ".join(hard_fail)
    except Exception as e:
        ok = False
        err = str(e)
        eval_result = {
            "score": 0,
            "topics": 0,
            "claims": 0,
            "disagreements": 0,
            "topic_hit": False,
            "speaker_cov": False,
            "stance_ok": False,
            "ts_ok": False,
            "chronological_ok": False,
            "quote_grounding_ratio": 0.0,
            "quote_count": 0,
        }

    return {
        "ok": ok,
        "error": err,
        "elapsed_s": elapsed,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "cost_usd": cost,
        "parse_mode": parse_mode,
        **eval_result,
    }


def ensure_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS benchmark_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            experiment_key TEXT NOT NULL,
            prompt_version TEXT NOT NULL,
            transcript_hash TEXT NOT NULL,
            model TEXT NOT NULL,
            run_number INTEGER NOT NULL,
            ok INTEGER NOT NULL,
            error TEXT,
            elapsed_s REAL NOT NULL,
            prompt_tokens INTEGER NOT NULL,
            completion_tokens INTEGER NOT NULL,
            cost_usd REAL NOT NULL,
            score INTEGER NOT NULL,
            topics INTEGER NOT NULL,
            claims INTEGER NOT NULL,
            disagreements INTEGER NOT NULL,
            topic_hit INTEGER NOT NULL,
            speaker_cov INTEGER NOT NULL,
            stance_ok INTEGER NOT NULL,
            ts_ok INTEGER NOT NULL,
            UNIQUE(experiment_key, prompt_version, transcript_hash, model, run_number)
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_benchmark_runs_lookup "
        "ON benchmark_runs(experiment_key, prompt_version, transcript_hash, model)"
    )
    conn.commit()


def get_existing_runs(
    conn: sqlite3.Connection,
    experiment_key: str,
    prompt_version: str,
    tx_hash: str,
    model: str,
) -> list[dict]:
    cur = conn.execute(
        """
        SELECT run_number, ok, error, elapsed_s, prompt_tokens, completion_tokens, cost_usd,
               score, topics, claims, disagreements, topic_hit, speaker_cov, stance_ok, ts_ok
        FROM benchmark_runs
        WHERE experiment_key=? AND prompt_version=? AND transcript_hash=? AND model=?
        ORDER BY run_number ASC
        """,
        (experiment_key, prompt_version, tx_hash, model),
    )
    out = []
    for row in cur.fetchall():
        out.append(
            {
                "run_number": int(row[0]),
                "ok": bool(row[1]),
                "error": row[2],
                "elapsed_s": float(row[3]),
                "prompt_tokens": int(row[4]),
                "completion_tokens": int(row[5]),
                "cost_usd": float(row[6]),
                "score": int(row[7]),
                "topics": int(row[8]),
                "claims": int(row[9]),
                "disagreements": int(row[10]),
                "topic_hit": bool(row[11]),
                "speaker_cov": bool(row[12]),
                "stance_ok": bool(row[13]),
                "ts_ok": bool(row[14]),
            }
        )
    return out


def insert_run(
    conn: sqlite3.Connection,
    experiment_key: str,
    prompt_version: str,
    tx_hash: str,
    model: str,
    run_number: int,
    run: dict,
) -> None:
    conn.execute(
        """
        INSERT INTO benchmark_runs (
            experiment_key, prompt_version, transcript_hash, model, run_number,
            ok, error, elapsed_s, prompt_tokens, completion_tokens, cost_usd,
            score, topics, claims, disagreements, topic_hit, speaker_cov, stance_ok, ts_ok
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            experiment_key,
            prompt_version,
            tx_hash,
            model,
            run_number,
            1 if run["ok"] else 0,
            run["error"],
            float(run["elapsed_s"]),
            int(run["prompt_tokens"]),
            int(run["completion_tokens"]),
            float(run["cost_usd"]),
            int(run["score"]),
            int(run["topics"]),
            int(run["claims"]),
            int(run["disagreements"]),
            1 if run["topic_hit"] else 0,
            1 if run["speaker_cov"] else 0,
            1 if run["stance_ok"] else 0,
            1 if run["ts_ok"] else 0,
        ),
    )
    conn.commit()


def list_tested_models(conn: sqlite3.Connection) -> set[str]:
    cur = conn.execute("SELECT DISTINCT model FROM benchmark_runs")
    return {row[0] for row in cur.fetchall()}


def summarize_model_runs(model: str, runs: list[dict]) -> dict:
    if not runs:
        return {
            "model": model,
            "runs": 0,
            "ok_runs": 0,
            "ok_rate": 0.0,
            "avg_score": 0.0,
            "avg_cost_usd": 0.0,
            "avg_latency_s": 0.0,
            "avg_topics": 0.0,
            "avg_claims": 0.0,
            "avg_disagreements": 0.0,
            "topic_hit_rate": 0.0,
            "speaker_cov_rate": 0.0,
            "value_score": 0.0,
        }

    n = len(runs)
    ok_runs = sum(1 for r in runs if r["ok"])
    avg_score = sum(r["score"] for r in runs) / n
    avg_cost = sum(r["cost_usd"] for r in runs) / n
    avg_latency = sum(r["elapsed_s"] for r in runs) / n
    avg_topics = sum(r["topics"] for r in runs) / n
    avg_claims = sum(r["claims"] for r in runs) / n
    avg_dis = sum(r["disagreements"] for r in runs) / n
    topic_hit_rate = sum(1 for r in runs if r["topic_hit"]) / n
    speaker_cov_rate = sum(1 for r in runs if r["speaker_cov"]) / n
    ok_rate = ok_runs / n
    value_score = (avg_score * ok_rate) / max(avg_cost, 1e-6)

    return {
        "model": model,
        "runs": n,
        "ok_runs": ok_runs,
        "ok_rate": ok_rate,
        "avg_score": avg_score,
        "avg_cost_usd": avg_cost,
        "avg_latency_s": avg_latency,
        "avg_topics": avg_topics,
        "avg_claims": avg_claims,
        "avg_disagreements": avg_dis,
        "topic_hit_rate": topic_hit_rate,
        "speaker_cov_rate": speaker_cov_rate,
        "value_score": value_score,
    }


def parse_models_csv(s: str) -> list[str]:
    if not s.strip():
        return []
    return [m.strip() for m in s.split(",") if m.strip()]


def suggest_new_colossi(
    catalog: list[dict],
    tested: set[str],
    exclude: set[str],
    count: int,
    max_output_per_m: float,
    min_context: int,
) -> list[str]:
    hints = (
        "thinking",
        "reason",
        "r1",
        "max",
        "pro",
        "grok",
        "k2",
        "deepseek",
        "large",
    )

    candidates = []
    for m in catalog:
        model_id = m["id"]
        if not model_id or model_id in tested or model_id in exclude:
            continue
        out_per_m = m["completion_price"] * 1_000_000
        if out_per_m <= 0 or out_per_m > max_output_per_m:
            continue
        if m["context_length"] < min_context:
            continue
        lowered = f"{model_id} {m['name']} {m['description']}".lower()
        hint_score = sum(1 for h in hints if h in lowered)
        flash_penalty = 1 if "flash" in lowered else 0
        score = (
            hint_score * 4
            + min(m["context_length"] / 200_000, 3.0)
            + (max_output_per_m - out_per_m) / max_output_per_m
            - flash_penalty
        )
        candidates.append((score, m["context_length"], -out_per_m, model_id))

    candidates.sort(reverse=True)
    return [c[3] for c in candidates[:count]]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=2)
    parser.add_argument("--models", type=str, default="")
    parser.add_argument("--auto-new", type=int, default=0, help="Auto-pick N new low-cost colossi")
    parser.add_argument("--max-output-per-m", type=float, default=5.0)
    parser.add_argument("--min-context", type=int, default=120000)
    parser.add_argument("--exclude-models", type=str, default="")
    parser.add_argument("--max-transcript-chars", type=int, default=10000)
    parser.add_argument("--db-path", type=str, default=str(DEFAULT_DB_PATH))
    parser.add_argument("--results-path", type=str, default=str(DEFAULT_RESULTS_PATH))
    parser.add_argument("--experiment-key", type=str, default="debate-json-economical-colossi")
    parser.add_argument("--allow-retest", action="store_true")
    parser.add_argument("--hard-mode", action="store_true")
    parser.add_argument("--grounding-min-ratio", type=float, default=0.6)
    parser.add_argument("--max-tokens", type=int, default=0)
    parser.add_argument("--enable-json-repair", action="store_true")
    parser.add_argument("--repair-model", type=str, default="openai/gpt-4o-mini")
    args = parser.parse_args()

    api_key = read_openrouter_key()
    excerpt = load_transcript_excerpt(args.max_transcript_chars)
    tx_hash = transcript_hash(excerpt)
    catalog = get_models_catalog(api_key)
    prices = {m["id"]: m for m in catalog}

    db_path = Path(args.db_path)
    conn = sqlite3.connect(db_path)
    ensure_db(conn)

    manual_models = parse_models_csv(args.models)
    excluded = set(parse_models_csv(args.exclude_models))
    tested = list_tested_models(conn)

    auto_models = []
    if args.auto_new > 0:
        auto_models = suggest_new_colossi(
            catalog=catalog,
            tested=tested,
            exclude=excluded.union(set(manual_models)),
            count=args.auto_new,
            max_output_per_m=args.max_output_per_m,
            min_context=args.min_context,
        )
        if len(auto_models) < args.auto_new:
            print(
                f"Warning: requested {args.auto_new} new models, found only {len(auto_models)} with current filters."
            )

    selected_models = []
    for m in manual_models + auto_models:
        if m not in selected_models:
            selected_models.append(m)

    if not selected_models:
        raise RuntimeError("No models selected. Use --models and/or --auto-new.")

    print(f"DB: {db_path}")
    prompt_version = PROMPT_VERSION_BASE + ("-hard-v1" if args.hard_mode else "")
    if args.enable_json_repair:
        prompt_version += "-json-repair-v1"
    print(f"Experiment: {args.experiment_key} | prompt={prompt_version} | transcript_hash={tx_hash}")
    if auto_models:
        print("Auto-selected new models:")
        for m in auto_models:
            print(f"  - {m}")
    print("\nRunning benchmark...")

    summaries = []
    for model in selected_models:
        print(f"- {model}")
        if model in excluded:
            print("  skipped: in exclude list")
            continue

        existing = get_existing_runs(conn, args.experiment_key, prompt_version, tx_hash, model)
        runs_to_do = args.runs if args.allow_retest else max(0, args.runs - len(existing))

        if runs_to_do == 0:
            print(f"  skipped: already has {len(existing)}/{args.runs} runs in DB")
        else:
            next_run = (max([r["run_number"] for r in existing], default=0)) + 1
            for i in range(runs_to_do):
                run_no = next_run + i
                try:
                    r = run_once(
                        model,
                        excerpt,
                        api_key,
                        prices,
                        hard_mode=args.hard_mode,
                        grounding_min_ratio=args.grounding_min_ratio,
                        max_tokens_override=args.max_tokens if args.max_tokens > 0 else None,
                        enable_json_repair=args.enable_json_repair,
                        repair_model=args.repair_model,
                    )
                except Exception as e:
                    r = {
                        "ok": False,
                        "error": str(e),
                        "elapsed_s": 0.0,
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "cost_usd": 0.0,
                        "score": 0,
                        "topics": 0,
                        "claims": 0,
                        "disagreements": 0,
                        "topic_hit": False,
                        "speaker_cov": False,
                        "stance_ok": False,
                        "ts_ok": False,
                        "chronological_ok": False,
                        "quote_grounding_ratio": 0.0,
                        "quote_count": 0,
                        "parse_mode": "failed",
                    }
                insert_run(conn, args.experiment_key, prompt_version, tx_hash, model, run_no, r)
                print(
                    f"  run {run_no}: ok={r['ok']} score={r['score']} "
                    f"cost=${r['cost_usd']:.4f} t={r['elapsed_s']:.1f}s parse={r.get('parse_mode', 'n/a')}"
                )
                if not r["ok"]:
                    print(f"    error: {r['error']}")
                elif args.hard_mode:
                    print(
                        f"    hard: quote_grounding={r['quote_grounding_ratio']:.0%} "
                        f"quotes={r['quote_count']} chrono_ok={r['chronological_ok']}"
                    )

        all_runs = get_existing_runs(conn, args.experiment_key, prompt_version, tx_hash, model)
        used = all_runs[-args.runs :] if len(all_runs) > args.runs else all_runs
        summaries.append(summarize_model_runs(model, used))

    summaries.sort(key=lambda x: (x["ok_rate"], x["avg_score"], -x["avg_cost_usd"]), reverse=True)

    print("\n=== Summary (latest window) ===")
    for s in summaries:
        print(
            f"{s['model']}\n"
            f"  ok {s['ok_runs']}/{s['runs']} ({s['ok_rate']:.0%}) | "
            f"score {s['avg_score']:.1f} | cost ${s['avg_cost_usd']:.4f} | latency {s['avg_latency_s']:.1f}s | value {s['value_score']:.0f}\n"
            f"  topics {s['avg_topics']:.1f} | claims {s['avg_claims']:.1f} | disagr {s['avg_disagreements']:.1f} | "
            f"topic_hit {s['topic_hit_rate']:.0%} | spk_cov {s['speaker_cov_rate']:.0%}"
        )

    results_payload = {
        "db_path": str(db_path),
        "experiment_key": args.experiment_key,
        "prompt_version": prompt_version,
        "transcript_hash": tx_hash,
        "selected_models": selected_models,
        "auto_models": auto_models,
        "enable_json_repair": bool(args.enable_json_repair),
        "repair_model": args.repair_model,
        "summaries": summaries,
    }
    results_path = Path(args.results_path)
    results_path.write_text(json.dumps(results_payload, indent=2), encoding="utf-8")
    print(f"\nSaved results JSON: {results_path}")
    print(f"Persistent DB: {db_path}")


if __name__ == "__main__":
    main()

