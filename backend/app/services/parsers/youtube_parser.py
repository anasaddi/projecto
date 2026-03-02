import re


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_youtube(url: str) -> dict:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from urllib.parse import parse_qs, urlparse
        vid = None
        if "v=" in url:
            vid = parse_qs(urlparse(url).query).get("v", [None])[0]
        if not vid and "youtu.be/" in url:
            vid = url.split("youtu.be/")[-1].split("?")[0]
        if not vid:
            return {
                "raw_text": "",
                "clean_text": "",
                "error_code": "invalid_url",
                "error_message": "Could not extract video ID",
                "diagnostics": {},
            }
        transcript_list = YouTubeTranscriptApi.get_transcript(vid)
        raw_text = " ".join(item["text"] for item in transcript_list)
        clean_text = _normalize(raw_text)
        return {"raw_text": raw_text, "clean_text": clean_text, "diagnostics": {"video_id": vid}}
    except Exception as e:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "transcript_error",
            "error_message": str(e),
            "diagnostics": {},
        }
