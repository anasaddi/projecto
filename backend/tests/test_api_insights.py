import pytest
from app.db.models import Source, Content


@pytest.fixture
def source_and_content(db_session):
    src = Source(tipo="note", url_or_path="/tmp/x.md", title="Test", status="ready", trust_score=7)
    db_session.add(src)
    db_session.commit()
    db_session.refresh(src)
    content = Content(source_id=src.id, raw_text="Hello world", clean_text="Hello world")
    db_session.add(content)
    db_session.commit()
    db_session.refresh(content)
    return src, content


def test_create_insight(client, source_and_content):
    _, content = source_and_content
    r = client.post(
        "/api/insights/",
        json={
            "content_id": content.id,
            "text": "Hello world",
            "transferable_principle": "Test principle",
            "applicability_contexts": ["coding", "reviews"],
            "session_intent": "deep_dive",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["text"] == "Hello world"
    assert data["tipo"] == "manual"
    assert data["session_intent"] == "deep_dive"


def test_list_insights_by_content(client, source_and_content):
    _, content = source_and_content
    client.post("/api/insights/", json={"content_id": content.id, "text": "Insight one", "session_intent": "deep_dive"})
    client.post("/api/insights/", json={"content_id": content.id, "text": "Insight two", "session_intent": "skimming"})
    r = client.get("/api/insights/", params={"content_id": content.id})
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 2


def test_update_insight(client, source_and_content):
    _, content = source_and_content
    create = client.post(
        "/api/insights/",
        json={"content_id": content.id, "text": "Original", "session_intent": "deep_dive"},
    )
    iid = create.json()["id"]
    r = client.patch("/api/insights/" + str(iid), json={"transferable_principle": "Updated principle"})
    assert r.status_code == 200
    assert r.json()["transferable_principle"] == "Updated principle"


def test_delete_insight(client, source_and_content):
    _, content = source_and_content
    create = client.post(
        "/api/insights/",
        json={"content_id": content.id, "text": "To delete", "session_intent": "auto"},
    )
    iid = create.json()["id"]
    r = client.delete("/api/insights/" + str(iid))
    assert r.status_code == 204
    get_r = client.get("/api/insights/" + str(iid))
    assert get_r.status_code == 404
