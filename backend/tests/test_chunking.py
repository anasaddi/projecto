from app.services.chunking import chunk_text


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_small():
    text = "One two three four five."
    chunks = chunk_text(text, size=500, overlap=50)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_with_overlap():
    text = "a" * 600
    chunks = chunk_text(text, size=500, overlap=50)
    assert len(chunks) >= 2
    assert sum(len(c) for c in chunks) >= 600
