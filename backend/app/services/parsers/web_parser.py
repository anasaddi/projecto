import re
import httpx


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_web(url: str) -> dict:
    try:
        with httpx.Client(follow_redirects=True, timeout=30) as client:
            r = client.get(url)
            r.raise_for_status()
            html = r.text
    except Exception as e:
        return {
            "raw_text": "",
            "clean_text": "",
            "error_code": "fetch_error",
            "error_message": str(e),
            "diagnostics": {},
        }
    try:
        from bs4 import BeautifulSoup
        from readability import Document
        doc = Document(html)
        soup = BeautifulSoup(doc.summary(), "html.parser")
        raw_text = soup.get_text(separator="\n")
        clean_text = _normalize(raw_text)
    except Exception as e:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style"]):
            tag.decompose()
        raw_text = soup.get_text(separator="\n")
        clean_text = _normalize(raw_text)
        diagnostics = {"warnings": ["readability failed, used fallback: " + str(e)]}
    else:
        diagnostics = {}
    return {"raw_text": raw_text, "clean_text": clean_text, "diagnostics": diagnostics}
