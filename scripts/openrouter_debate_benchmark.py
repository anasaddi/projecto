import json
import re
import time
import argparse
from pathlib import Path
from urllib import request, error


ROOT = Path(__file__).resolve().parents[1]
TRANSCRIBER_PATH = ROOT / "backend" / "app" / "services" / "transcripts" / "debate_transcriber.py"
TRANSCRIPT_PATH = ROOT / "backend" / ".cache" / "XtxFdX7yIAs_transcript.txt"

# Keep test cheap: mostly low-cost models with one stronger reference.
MODELS = [
    "stepfun/step-3.5-flash",
    "z-ai/glm-4.7-flash",
    "qwen/qwen3-coder-next",
    "allenai/olmo-3.1-32b-instruct",
    "minimax/minimax-m2.5",
    "z-ai/glm-5",
]

RUNS_PER_MODEL = 2
MAX_TRANSCRIPT_CHARS = 10000

TOPIC_KEYWORDS = {"quran", "jesus", "disciple", "disciples", "follower", "followers", "bible", "messiah"}


def read_openrouter_key() -> str:
    import os
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable required")
    return key


def load_transcript_excerpt() -> str:
    text = TRANSCRIPT_PATH.read_text(encoding="utf-8")
    text = text[:MAX_TRANSCRIPT_CHARS]
    return text


def post_json(url: str, payload: dict, api_key: str) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost",
            "X-Title": "KM Debate Benchmark",
        },
    )
    try:
        with request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body[:600]}")


def get_model_prices(api_key: str) -> dict:
    req = request.Request(
        "https://openrouter.ai/api/v1/models",
        method="GET",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    with request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    out = {}
    for m in payload.get("data", []):
        out[m["id"]] = {
            "prompt": float(m.get("pricing", {}).get("prompt", "0") or 0),
            "completion": float(m.get("pricing", {}).get("completion", "0") or 0),
        }
    return out


def build_messages(excerpt: str) -> list:
    system = (
        "You are an argument-mining engine. Output ONLY valid JSON object.\n"
        "No markdown, no prose."
    )
    user = (
        "Analyze this debate transcript excerpt and extract a compact structured map.\n"
        "Rules:\n"
        "- Use speaker ids exactly as seen (A, B, etc.)\n"
        "- Keep timestamps in seconds (float)\n"
        "- Claims must be concise and specific\n"
        "- Use stance values only: pro, contra, neutral\n"
        "- For disagreements, include only explicit disagreement moments\n\n"
        "- Keep output compact: max 6 topics, max 12 claims, max 6 disagreements\n"
        "- evidence_quote must be short (max 20 words)\n"
        "Return JSON with exact schema:\n"
        "{\n"
        '  "topics": [{"name": "string", "summary": "string"}],\n'
        '  "claims": [{"speaker": "string", "timestamp_s": 0.0, "topic": "string", "stance": "pro|contra|neutral", "claim": "string", "evidence_quote": "string"}],\n'
        '  "disagreements": [{"topic": "string", "speaker_a": "string", "speaker_b": "string", "timestamp_s": 0.0, "reason": "string"}]\n'
        "}\n\n"
        "Transcript:\n"
        f"{excerpt}"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def parse_response_content(resp: dict) -> dict:
    content = (
        resp.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        raise ValueError("empty content")
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = cleaned.removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try extracting first JSON object from noisy output.
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def evaluate_output(obj: dict) -> dict:
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

    # Score 0..100
    score = 0
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
    }


def run_once(model: str, excerpt: str, api_key: str, prices: dict) -> dict:
    payload = {
        "model": model,
        "messages": build_messages(excerpt),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "max_tokens": 1200,
    }
    started = time.time()
    try:
        resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
    except Exception as e:
        # Some providers/models do not support response_format=json_object.
        if "response_format" in str(e):
            payload.pop("response_format", None)
            resp = post_json("https://openrouter.ai/api/v1/chat/completions", payload, api_key)
        else:
            raise
    elapsed = time.time() - started

    usage = resp.get("usage", {}) or {}
    pt = int(usage.get("prompt_tokens", 0) or 0)
    ct = int(usage.get("completion_tokens", 0) or 0)
    p = prices.get(model, {"prompt": 0.0, "completion": 0.0})
    # OpenRouter pricing values are per token in dollars.
    cost = pt * p["prompt"] + ct * p["completion"]

    try:
        parsed = parse_response_content(resp)
        eval_result = evaluate_output(parsed)
        ok = True
        err = None
    except Exception as e:
        ok = False
        eval_result = {"score": 0, "topics": 0, "claims": 0, "disagreements": 0, "topic_hit": False, "speaker_cov": False, "stance_ok": False, "ts_ok": False}
        err = str(e)

    return {
        "ok": ok,
        "error": err,
        "elapsed_s": elapsed,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "cost_usd": cost,
        **eval_result,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=RUNS_PER_MODEL)
    parser.add_argument("--models", type=str, default="")
    args = parser.parse_args()

    selected_models = MODELS
    if args.models.strip():
        selected_models = [m.strip() for m in args.models.split(",") if m.strip()]

    api_key = read_openrouter_key()
    excerpt = load_transcript_excerpt()
    prices = get_model_prices(api_key)

    rows = []
    print("Running benchmark...")
    for m in selected_models:
        model_runs = []
        print(f"- {m}")
        for i in range(args.runs):
            try:
                r = run_once(m, excerpt, api_key, prices)
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
                }
            model_runs.append(r)
            print(f"  run {i+1}: ok={r['ok']} score={r['score']} cost=${r['cost_usd']:.4f} t={r['elapsed_s']:.1f}s")
            if not r["ok"]:
                print(f"    error: {r['error']}")

        ok_runs = [r for r in model_runs if r["ok"]]
        agg = {
            "model": m,
            "runs": len(model_runs),
            "ok_runs": len(ok_runs),
            "ok_rate": len(ok_runs) / len(model_runs),
            "avg_score": sum(r["score"] for r in model_runs) / len(model_runs),
            "avg_cost_usd": sum(r["cost_usd"] for r in model_runs) / len(model_runs),
            "avg_latency_s": sum(r["elapsed_s"] for r in model_runs) / len(model_runs),
            "avg_topics": sum(r["topics"] for r in model_runs) / len(model_runs),
            "avg_claims": sum(r["claims"] for r in model_runs) / len(model_runs),
            "avg_disagreements": sum(r["disagreements"] for r in model_runs) / len(model_runs),
            "topic_hit_rate": sum(1 for r in model_runs if r["topic_hit"]) / len(model_runs),
            "speaker_cov_rate": sum(1 for r in model_runs if r["speaker_cov"]) / len(model_runs),
        }
        agg["value_score"] = (agg["avg_score"] * agg["ok_rate"]) / max(agg["avg_cost_usd"], 1e-6)
        rows.append(agg)

    rows.sort(key=lambda x: (x["ok_rate"], x["avg_score"], -x["avg_cost_usd"]), reverse=True)

    print("\n=== Summary (sorted by score) ===")
    for r in rows:
        print(
            f"{r['model']}\n"
            f"  ok {r['ok_runs']}/{r['runs']} ({r['ok_rate']:.0%}) | score {r['avg_score']:.1f} | cost ${r['avg_cost_usd']:.4f} | latency {r['avg_latency_s']:.1f}s | value {r['value_score']:.0f}\n"
            f"  topics {r['avg_topics']:.1f} | claims {r['avg_claims']:.1f} | disagr {r['avg_disagreements']:.1f} | topic_hit {r['topic_hit_rate']:.0%} | spk_cov {r['speaker_cov_rate']:.0%}"
        )

    out_path = ROOT / "benchmark_openrouter_results.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()

