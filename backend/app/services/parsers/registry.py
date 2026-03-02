from sqlalchemy.orm import Session
from app.db.models import Source
from app.services.parsers.pdf_parser import parse_pdf
from app.services.parsers.web_parser import parse_web
from app.services.parsers.markdown_parser import parse_markdown
from app.services.parsers.youtube_parser import parse_youtube
from app.services.parsers.audio_parser import parse_audio


def parse_source(source: Source, db: Session) -> dict | None:
    tipo = (source.tipo or "").lower()
    path_or_url = source.url_or_path or ""
    if tipo == "pdf" or path_or_url.endswith(".pdf"):
        return parse_pdf(path_or_url)
    if tipo == "article" or (path_or_url.startswith("http://") or path_or_url.startswith("https://")):
        if "youtube.com" in path_or_url or "youtu.be" in path_or_url:
            return parse_youtube(path_or_url)
        return parse_web(path_or_url)
    if tipo == "video":
        return parse_youtube(path_or_url)
    if tipo == "audio" or path_or_url.endswith((".mp3", ".wav", ".m4a", ".ogg")):
        return parse_audio(path_or_url)
    if tipo == "note" or path_or_url.endswith(".md") or path_or_url.endswith(".markdown"):
        return parse_markdown(path_or_url)
    # Fallback: try as local file text
    return parse_markdown(path_or_url)
