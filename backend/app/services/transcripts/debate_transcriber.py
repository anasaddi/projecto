"""
Trascrittore PRO per dibattiti YouTube - integrato KM.
AssemblyAI (speaker + timestamp) + OpenRouter LLM (pulizia preservando timestamp).
Cache disco per video_id, chunk più grandi, skip LLM per video corti.
"""

import os
import re
import asyncio
import hashlib
import logging
import shutil
from pathlib import Path
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Tuple, Callable

import yt_dlp
import assemblyai as aai
from openai import AsyncOpenAI
import aiofiles

# API keys: env vars in prod, fallback for dev
ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY", "").strip()
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()
if not ASSEMBLYAI_API_KEY or not OPENROUTER_API_KEY:
    logger.warning("ASSEMBLYAI_API_KEY or OPENROUTER_API_KEY missing in env - set in .env for production")

if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY

logger = logging.getLogger(__name__)

# Opzioni yt-dlp per ridurre 403 su YouTube (client alternativi + UA browser-like)
YT_DLP_BASE_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
    "http_headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
}

def _find_ffmpeg_dir() -> Optional[str]:
    """Ritorna la directory di ffmpeg (per ffmpeg_location in yt-dlp) o None se non trovato."""
    exe = shutil.which("ffmpeg")
    if exe:
        return str(Path(exe).resolve().parent)
    for d in ["C:\\ffmpeg\\bin", "C:\\Program Files\\ffmpeg\\bin", "/usr/bin", "/usr/local/bin"]:
        if Path(d).joinpath("ffmpeg").exists() or Path(d).joinpath("ffmpeg.exe").exists():
            return d
    return None


# Pool condiviso per non creare thread a ogni richiesta
_executor: Optional[ThreadPoolExecutor] = None


def _get_executor() -> ThreadPoolExecutor:
    global _executor
    if _executor is None:
        _executor = ThreadPoolExecutor(max_workers=(os.cpu_count() or 4) * 2)
    return _executor


@dataclass
class TranscriberConfig:
    """Config ottimizzata: meno chiamate LLM, cache, skip corti."""
    llm_models: List[str] = field(default_factory=lambda: [
        "openai/gpt-4o-mini",
        "mistralai/mistral-nemo",
    ])
    model_costs: Dict[str, Tuple[float, float]] = field(default_factory=lambda: {
        "openai/gpt-4o-mini": (0.150, 0.600),
        "mistralai/mistral-nemo": (0.02, 0.04),
    })
    temperature: float = 0.0
    llm_timeout_sec: float = 120.0
    target_chunk_seconds: int = 60 * 20  # 20 min → meno chunk, meno API
    overlap_utterances: int = 3
    max_parallel_chunks: int = 12
    enable_smart_cache: bool = True
    skip_identical_chunks: bool = True
    aggressive_dedup: bool = True
    # Skip pulizia LLM se trascrizione sotto questa durata (secondi) → ritorno raw
    skip_llm_if_duration_under_sec: float = 90.0
    cache_dir: str = ".cache"
    downloads_dir: str = "downloads"


def _extract_video_id(url: str) -> str:
    try:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url.strip())
        if "youtu.be" in parsed.netloc:
            return (parsed.path or "").strip("/") or hashlib.sha1(url.encode()).hexdigest()[:11]
        if "youtube.com" in parsed.netloc:
            q = parse_qs(parsed.query)
            return q.get("v", [None])[0] or hashlib.sha1(url.encode()).hexdigest()[:11]
    except Exception:
        pass
    return hashlib.sha1(url.encode()).hexdigest()[:11]


def _fetch_youtube_captions(video_id: str, language_hint: Optional[str] = None) -> Optional[str]:
    """
    Recupera i sottotitoli nativi di YouTube (istantaneo, spesso migliore per l'italiano).
    Ritorna testo in formato Speaker A: [ts] text, oppure None se non disponibili.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        items = YouTubeTranscriptApi.get_transcript(video_id)
        if not items:
            return None
        lines = []
        for item in items:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            start = item.get("start", 0)
            if isinstance(start, (int, float)):
                ts = float(start)
            else:
                ts = 0.0
            lines.append(f"Speaker A: [{ts:.1f}s] {text}")
        if not lines:
            return None
        return "\n\n".join(lines)
    except Exception as e:
        logger.debug("YouTube captions not available for %s: %s", video_id, e)
        return None


class DebateTranscriber:
    """Trascrittore dibattiti: download → AssemblyAI → chunk → LLM clean → merge. Ritorna testo."""

    def __init__(self, config: Optional[TranscriberConfig] = None):
        self.cfg = config or TranscriberConfig()
        self._client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
            timeout=self.cfg.llm_timeout_sec,
        )
        self._pool = _get_executor()
        self._chunk_cache: Dict[str, str] = {}
        Path(self.cfg.cache_dir).mkdir(exist_ok=True, parents=True)
        Path(self.cfg.downloads_dir).mkdir(exist_ok=True, parents=True)

    def _get_cached_transcript(self, video_id: str) -> Optional[str]:
        """Ritorna trascrizione da cache disco se presente."""
        if not self.cfg.enable_smart_cache:
            return None
        p = Path(self.cfg.cache_dir) / f"{video_id}_transcript.txt"
        if p.exists():
            try:
                return p.read_text(encoding="utf-8")
            except Exception:
                pass
        return None

    def _save_cached_transcript(self, video_id: str, text: str) -> None:
        try:
            p = Path(self.cfg.cache_dir) / f"{video_id}_transcript.txt"
            p.write_text(text, encoding="utf-8")
        except Exception as e:
            logger.warning("Cache transcript save failed: %s", e)

    async def _get_video_info(self, url: str) -> Dict:
        vid = _extract_video_id(url)
        cache_file = Path(self.cfg.cache_dir) / f"{vid}_info.json"
        if cache_file.exists() and self.cfg.enable_smart_cache:
            async with aiofiles.open(cache_file, "r", encoding="utf-8") as f:
                import json
                return json.loads(await f.read())

        def _extract():
            with yt_dlp.YoutubeDL(YT_DLP_BASE_OPTS) as ydl:
                return ydl.extract_info(url, download=False)

        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(self._pool, _extract)
        result = {
            "title": info.get("title") or "Senza Titolo",
            "duration": info.get("duration") or 0,
            "uploader": info.get("uploader") or "Sconosciuto",
            "id": vid,
        }
        try:
            async with aiofiles.open(cache_file, "w", encoding="utf-8") as f:
                import json
                await f.write(json.dumps(result, ensure_ascii=False))
        except Exception:
            pass
        return result

    async def _download_audio(self, url: str, video_id: str) -> Path:
        out = Path(self.cfg.downloads_dir) / f"{video_id}.wav"
        if out.exists():
            return out

        ffmpeg_dir = _find_ffmpeg_dir()
        if not ffmpeg_dir:
            raise RuntimeError(
                "FFmpeg non trovato. Installa FFmpeg e aggiungilo al PATH, "
                "oppure mettilo in C:\\ffmpeg\\bin. Vedi https://ffmpeg.org/download.html"
            )

        def _dl():
            opts = {
                **YT_DLP_BASE_OPTS,
                "format": "bestaudio/best",
                "outtmpl": str(Path(self.cfg.downloads_dir) / f"{video_id}.%(ext)s"),
                "ffmpeg_location": ffmpeg_dir,
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }],
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self._pool, _dl)
        return out

    async def _transcribe_audio(self, audio_path: Path, speakers: Optional[int], language_code: Optional[str] = None) -> aai.Transcript:
        def _run():
            cfg = {
                "speaker_labels": True,
                "punctuate": True,
                "format_text": True,
                "speech_model": aai.SpeechModel.best,
            }
            if speakers:
                cfg["speakers_expected"] = speakers
            if language_code and language_code != "auto":
                cfg["language_code"] = language_code
            transcriber = aai.Transcriber(config=aai.TranscriptionConfig(**cfg))
            t = transcriber.transcribe(str(audio_path))
            if t.status == aai.TranscriptStatus.error:
                raise RuntimeError(t.error or "AssemblyAI error")
            return t

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._pool, _run)

    def _create_chunks(self, utterances: List) -> List[str]:
        if not utterances:
            return []
        chunks = []
        current_lines = []
        chunk_start = utterances[0].start
        for i, u in enumerate(utterances):
            current_lines.append(f"Speaker {u.speaker}: [{u.start/1000:.1f}s] {u.text}")
            duration = (u.end - chunk_start) / 1000
            is_last = i == len(utterances) - 1
            if duration >= self.cfg.target_chunk_seconds or is_last:
                chunks.append("\n\n".join(current_lines))
                if not is_last:
                    overlap_idx = max(0, len(current_lines) - self.cfg.overlap_utterances)
                    current_lines = current_lines[overlap_idx:]
                    if i + 1 < len(utterances):
                        chunk_start = utterances[i - len(current_lines) + 1].start
        return chunks

    async def _process_chunk(self, chunk_text: str, chunk_idx: int) -> str:
        chash = hashlib.md5(chunk_text.encode()).hexdigest()
        if self.cfg.enable_smart_cache and chash in self._chunk_cache:
            return self._chunk_cache[chash]
        if self.cfg.skip_identical_chunks and chunk_idx > 0:
            pass  # reuse from cache by hash only

        system_prompt = """Sei un assistente per la pulizia di trascrizioni. Il tuo unico compito è pulire il testo preservando l'esatto formato originale, inclusi i timestamp.

REGOLE OBBLIGATORIE:
1. NON MODIFICARE MAI I TIMESTAMP: i marcatori come [12.3s] devono rimanere identici.
2. MANTIENI IL FORMATO: Speaker X: [12.3s] Testo...
3. Risposta = SOLO il testo della trascrizione pulita, niente spiegazioni o markdown.
4. Correggi grammatica e battiture; rimuovi riempitivi (uhm, like, cioè, tipo).
5. In dubbio restituisci il testo originale."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": chunk_text},
        ]
        orig_ts = len(re.findall(r"\[\d+(?:\.\d+)?s?\]", chunk_text))
        for model in self.cfg.llm_models:
            try:
                r = await self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=self.cfg.temperature,
                    max_tokens=4000,
                )
                result = (r.choices[0].message.content or "").strip()
                result_ts = len(re.findall(r"\[\d+(?:\.\d+)?s?\]", result))
                if result_ts < orig_ts * 0.8:
                    raise ValueError("Validazione timestamp fallita")
                self._chunk_cache[chash] = result
                return result
            except Exception as e:
                logger.debug("Chunk %s model %s: %s", chunk_idx, model, e)
                continue
        self._chunk_cache[chash] = chunk_text
        return chunk_text

    def _merge_dedup(self, cleaned_chunks: List[str]) -> str:
        all_lines = {}
        pattern = re.compile(r"^(Speaker [A-Z0-9_]+):\s*\[(\d+\.\d+)s\]\s*(.*)$")
        for chunk in cleaned_chunks:
            for line in chunk.split("\n"):
                line = line.strip()
                if not line:
                    continue
                m = pattern.match(line)
                if not m:
                    continue
                speaker, ts, text = m.groups()
                ts_f = float(ts)
                key = f"{speaker}-{ts_f:.1f}"
                if key not in all_lines or len(text) > len(all_lines[key]["text"]):
                    all_lines[key] = {"speaker": speaker, "ts": ts_f, "text": text}
        if not all_lines:
            return ""
        sorted_lines = sorted(all_lines.values(), key=lambda x: x["ts"])
        if self.cfg.aggressive_dedup:
            out = []
            prev = None
            for item in sorted_lines:
                cur = item["text"].lower().strip()
                if prev is not None and cur == prev:
                    continue
                out.append(f"{item['speaker']}: [{item['ts']:.1f}s] {item['text']}")
                prev = cur
            return "\n\n".join(out)
        return "\n\n".join(f"{x['speaker']}: [{x['ts']:.1f}s] {x['text']}" for x in sorted_lines)

    def _final_cleanup(self, text: str) -> str:
        text = re.sub(r"<\|[^\|]+\|>", "", text)
        text = re.sub(r"(\[\d+\.\d+s\])([^\s])", r"\1 \2", text)
        text = re.sub(r" +", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)
        return text.strip()

    async def run_for_video(
        self,
        url: str,
        speakers: Optional[int] = 2,
        language_code: Optional[str] = None,
        force_refresh: bool = False,
        use_assembly: bool = False,
        progress_callback: Optional[Callable[[str, str], None]] = None,
    ) -> Tuple[str, Dict, bool]:
        """
        Pipeline: cache disco → info → download → AssemblyAI → (opzionale LLM) → merge.
        Ritorna (testo_trascrizione, info_video, from_cache).
        progress_callback(stage, message) opzionale per aggiornare l'UI.
        """
        def _progress(stage: str, message: str) -> None:
            if progress_callback:
                try:
                    progress_callback(stage, message)
                except Exception:
                    pass

        video_id = _extract_video_id(url)
        cached = None if force_refresh else self._get_cached_transcript(video_id)
        if cached is not None:
            logger.info("Transcript cache hit: %s", video_id)
            _progress("info", "Recupero info video…")
            info = await self._get_video_info(url)
            return cached, info, True

        _progress("info", "Recupero info video…")
        info = await self._get_video_info(url)
        info["id"] = video_id

        # Prova prima i sottotitoli nativi YouTube (istantaneo, spesso migliori per italiano)
        # Se use_assembly=True, salta YouTube e usa sempre AssemblyAI (trascrizione più completa)
        if not use_assembly:
            _progress("info", "Prova sottotitoli YouTube…")
            yt_captions = await asyncio.get_event_loop().run_in_executor(
                self._pool, lambda: _fetch_youtube_captions(video_id, language_code)
            )
        else:
            yt_captions = None
        if yt_captions and len(yt_captions.strip()) > 100:
            logger.info("Using YouTube captions for %s", video_id)
            final = self._final_cleanup(yt_captions)
            self._save_cached_transcript(video_id, final)
            return final, info, False

        _progress("download", "Download audio in corso…")
        audio_path = await self._download_audio(url, video_id)
        _progress("transcribe", "Trascrizione con AssemblyAI…")
        transcript = await self._transcribe_audio(audio_path, speakers, language_code=language_code)
        if not transcript or not getattr(transcript, "utterances", None):
            raise RuntimeError("Trascrizione vuota")

        raw_lines = [
            f"Speaker {u.speaker}: [{u.start/1000:.1f}s] {u.text}"
            for u in transcript.utterances
            if (u.text or "").strip()
        ]
        raw_text = "\n\n".join(raw_lines)
        duration_sec = 0
        if transcript.utterances:
            duration_sec = (transcript.utterances[-1].end - transcript.utterances[0].start) / 1000

        if duration_sec < self.cfg.skip_llm_if_duration_under_sec:
            final = self._final_cleanup(raw_text)
            self._save_cached_transcript(video_id, final)
            return final, info, False

        _progress("cleanup", "Pulizia testo con LLM…")
        chunks = self._create_chunks(transcript.utterances)
        sem = asyncio.Semaphore(self.cfg.max_parallel_chunks)

        async def do_chunk(c: str, i: int) -> str:
            async with sem:
                return await self._process_chunk(c, i)

        tasks = [do_chunk(c, i) for i, c in enumerate(chunks)]
        cleaned = await asyncio.gather(*tasks, return_exceptions=True)
        cleaned_texts = []
        for i, r in enumerate(cleaned):
            if isinstance(r, Exception):
                logger.warning("Chunk %s failed: %s, using raw", i, r)
                cleaned_texts.append(chunks[i])
            else:
                cleaned_texts.append(r)
        merged = self._merge_dedup(cleaned_texts)
        final = self._final_cleanup(merged)
        self._save_cached_transcript(video_id, final)
        return final, info, False


async def get_youtube_transcript(
    url: str,
    speakers: Optional[int] = 2,
    language_code: Optional[str] = None,
    force_refresh: bool = False,
    use_assembly: bool = False,
    progress_callback: Optional[Callable[[str, str], None]] = None,
) -> Tuple[str, Dict, bool]:
    """Helper: una URL → (trascrizione, info, from_cache). Usa cache e config default."""
    t = DebateTranscriber()
    return await t.run_for_video(url, speakers=speakers, language_code=language_code, force_refresh=force_refresh, use_assembly=use_assembly, progress_callback=progress_callback)
