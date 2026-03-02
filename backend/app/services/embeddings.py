from functools import lru_cache
from app.config import get_settings


@lru_cache(maxsize=1)
def get_embedding_model():
    from sentence_transformers import SentenceTransformer
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed_texts(model, texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    vectors = model.encode(texts, convert_to_numpy=True)
    return vectors.tolist()
