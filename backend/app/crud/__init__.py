from app.crud import sources as crud_sources
from app.crud import content as crud_content
from app.crud import insights as crud_insights

# Re-export for route usage
def create_source(db, file=None, url=None, tipo=None, title=None, trust_score=7):
    return crud_sources.create_source(db, file=file, url=url, tipo=tipo, title=title, trust_score=trust_score)


def list_sources(db, skip=0, limit=50):
    return crud_sources.list_sources(db, skip=skip, limit=limit)


def get_source(db, source_id):
    return crud_sources.get_source(db, source_id)


def get_content_by_source(db, source_id):
    return crud_content.get_content_by_source(db, source_id)


def get_content(db, content_id):
    return crud_content.get_content(db, content_id)


def create_insight(db, data):
    return crud_insights.create_insight(db, data)


def list_insights(db, content_id=None, skip=0, limit=100):
    return crud_insights.list_insights(db, content_id=content_id, skip=skip, limit=limit)


def get_insight(db, insight_id):
    return crud_insights.get_insight(db, insight_id)


def update_insight(db, insight_id, data):
    return crud_insights.update_insight(db, insight_id, data)


def delete_insight(db, insight_id):
    return crud_insights.delete_insight(db, insight_id)
