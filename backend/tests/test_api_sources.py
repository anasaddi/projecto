import pytest
from unittest.mock import patch, MagicMock


@patch("app.crud.sources.run_pipeline")
def test_create_source_url(mock_pipeline, client):
    mock_pipeline.delay.return_value = None
    r = client.post(
        "/api/sources/",
        data={"url": "https://example.com/page", "tipo": "article", "trust_score": "7"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["tipo"] == "article"
    assert data["url_or_path"] == "https://example.com/page"
    assert data["status"] == "pending"
    mock_pipeline.delay.assert_called_once()


@patch("app.crud.sources.run_pipeline")
def test_list_sources(mock_pipeline, client):
    mock_pipeline.delay.return_value = None
    client.post("/api/sources/", data={"url": "https://a.com", "tipo": "article", "trust_score": "7"})
    r = client.get("/api/sources/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@patch("app.crud.sources.run_pipeline")
def test_get_source(mock_pipeline, client):
    mock_pipeline.delay.return_value = None
    create = client.post("/api/sources/", data={"url": "https://b.com", "tipo": "article", "trust_score": "7"})
    sid = create.json()["id"]
    r = client.get(f"/api/sources/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid
