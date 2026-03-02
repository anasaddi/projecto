import tempfile
from pathlib import Path
from app.services.parsers.pdf_parser import parse_pdf
from app.services.parsers.markdown_parser import parse_markdown
from app.services.parsers.web_parser import parse_web


def test_parse_markdown_file():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write("# Title\n\nHello **world**.")
        path = f.name
    try:
        out = parse_markdown(path)
        assert "clean_text" in out
        assert "Hello" in out.get("clean_text", "")
    finally:
        Path(path).unlink(missing_ok=True)


def test_parse_markdown_missing():
    out = parse_markdown("/nonexistent/path.md")
    assert out.get("error_code") == "file_not_found"
    assert out.get("clean_text") == ""


def test_parse_pdf_missing():
    out = parse_pdf("/nonexistent/file.pdf")
    assert "error" in str(out).lower() or "error_code" in out
    assert out.get("clean_text", "") == ""


def test_parse_web_invalid_url():
    # Should fail gracefully (fetch error or similar)
    out = parse_web("https://non-existent-domain-xyz-12345.com/page")
    assert "clean_text" in out
    # Either error or empty text
    assert out.get("error_code") is not None or len(out.get("clean_text", "")) == 0
