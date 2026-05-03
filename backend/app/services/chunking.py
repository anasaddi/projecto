def chunk_text(text: str, size: int = 500, overlap: int = 50) -> list[str]:
    if not text or not text.strip():
        return []
    if size <= 0:
        raise ValueError("size must be > 0")
    if overlap < 0 or overlap >= size:
        raise ValueError("overlap must be >= 0 and < size")
    text = text.strip()
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start = end - overlap
        if start >= len(text):
            break
    return chunks
