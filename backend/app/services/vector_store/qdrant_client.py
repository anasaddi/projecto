from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.config import get_settings


def get_qdrant() -> QdrantClient:
    s = get_settings()
    return QdrantClient(host=s.qdrant_host, port=s.qdrant_port)


def ensure_collection(client: QdrantClient):
    s = get_settings()
    collections = client.get_collections().collections
    names = [c.name for c in collections]
    if s.qdrant_collection not in names:
        # all-MiniLM-L6-v2 dimension
        client.create_collection(
            collection_name=s.qdrant_collection,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def index_chunk(client: QdrantClient, chunk_id: int, content_id: int, source_id: int, vector: list[float], text: str, tipo: str, trust_score: int):
    s = get_settings()
    client.upsert(
        collection_name=s.qdrant_collection,
        points=[
            PointStruct(
                id=chunk_id,
                vector=vector,
                payload={
                    "chunk_id": chunk_id,
                    "content_id": content_id,
                    "source_id": source_id,
                    "text": text[:2000],
                    "tipo": tipo,
                    "trust_score": trust_score,
                },
            )
        ],
    )


def search_similar(client: QdrantClient, query_vector: list[float], limit: int = 10, intent: str | None = None, min_weight: float = 0.3) -> list[dict]:
    s = get_settings()
    results = client.search(
        collection_name=s.qdrant_collection,
        query_vector=query_vector,
        limit=limit,
    )
    out = []
    for r in results:
        out.append({
            "chunk_id": r.payload.get("chunk_id"),
            "content_id": r.payload.get("content_id"),
            "source_id": r.payload.get("source_id"),
            "text": r.payload.get("text", ""),
            "score": float(r.score),
            "tipo": r.payload.get("tipo"),
            "trust_score": r.payload.get("trust_score"),
        })
    return out
