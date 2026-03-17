from app.repositories import sources as crud_sources
from app.repositories import content as crud_content
from app.repositories import insights as crud_insights

# Re-export for route usage
async def create_source(db, file=None, url=None, tipo=None, title=None, trust_score=7):
    return await crud_sources.create_source(db, file=file, url=url, tipo=tipo, title=title, trust_score=trust_score)

async def list_sources(db, skip=0, limit=50):
    return await crud_sources.list_sources(db, skip=skip, limit=limit)

async def get_source(db, source_id):
    return await crud_sources.get_source(db, source_id)

async def get_content_by_source(db, source_id):
    return await crud_content.get_content_by_source(db, source_id)

async def get_content(db, content_id):
    return await crud_content.get_content(db, content_id)

async def create_insight(db, data):
    return await crud_insights.create_insight(db, data)

async def list_insights(db, content_id=None, skip=0, limit=100):
    return await crud_insights.list_insights(db, content_id=content_id, skip=skip, limit=limit)

async def get_insight(db, insight_id):
    return await crud_insights.get_insight(db, insight_id)

async def update_insight(db, insight_id, data):
    return await crud_insights.update_insight(db, insight_id, data)

async def delete_insight(db, insight_id):
    return await crud_insights.delete_insight(db, insight_id)
