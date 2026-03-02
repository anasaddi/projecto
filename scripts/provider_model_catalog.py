import json
import os
import re
from pathlib import Path
from urllib import request


ROOT = Path(__file__).resolve().parents[1]
TRANSCRIBER_PATH = ROOT / "backend" / "app" / "services" / "transcripts" / "debate_transcriber.py"
OUT_DIR = ROOT / "scripts" / "provider_lists"


def read_openrouter_key() -> str:
    env_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    if env_key:
        return env_key
    text = TRANSCRIBER_PATH.read_text(encoding="utf-8")
    m = re.search(r'OPENROUTER_API_KEY\s*=\s*"([^"]+)"', text)
    if not m:
        raise RuntimeError("OPENROUTER_API_KEY not found")
    return m.group(1).strip()


def fetch_catalog(api_key: str) -> list[dict]:
    req = request.Request(
        "https://openrouter.ai/api/v1/models",
        method="GET",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    with request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("data", []) or []


def main() -> None:
    api_key = read_openrouter_key()
    catalog = fetch_catalog(api_key)
    model_ids = sorted({str(m.get("id", "")).strip() for m in catalog if m.get("id")})

    groups = {
        "grok": [m for m in model_ids if m.startswith("x-ai/")],
        "meta": [m for m in model_ids if m.startswith("meta-llama/")],
        "google": [m for m in model_ids if m.startswith("google/")],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, models in groups.items():
        (OUT_DIR / f"{name}_models.txt").write_text("\n".join(models), encoding="utf-8")
        (OUT_DIR / f"{name}_models.csv").write_text(",".join(models), encoding="utf-8")

    counts = {name: len(models) for name, models in groups.items()}
    (OUT_DIR / "provider_counts.json").write_text(json.dumps(counts, indent=2), encoding="utf-8")
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    main()
