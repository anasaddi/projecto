from functools import lru_cache
from app.config import get_settings


@lru_cache(maxsize=1)
def get_embedding_model():
    try:
        from sentence_transformers import SentenceTransformer
        settings = get_settings()
        return SentenceTransformer(settings.embedding_model)
    except ImportError:
        return None


def embed_texts(model, texts: list[str]) -> list[list[float]]:
    if not texts or model is None:
        return [[0.0] * 384 for _ in (texts or [])]
    vectors = model.encode(texts, convert_to_numpy=True)
    return vectors.tolist()
