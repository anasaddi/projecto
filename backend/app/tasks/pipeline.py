import asyncio
import logging
from app.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.services.ingestion_service import run_pipeline as run_pipeline_service

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def run_pipeline(self, source_id: int):
    """Celery task that delegates to the async ingestion service."""
    try:
        # Get or create event loop for this worker process/thread
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        async def _run():
            async with AsyncSessionLocal() as db:
                await run_pipeline_service(db, source_id)
                
        loop.run_until_complete(_run())
        
    except Exception as e:
        logger.error(f"Celery task failed for source {source_id}: {e}", exc_info=True)
        # self.retry(exc=e, countdown=60) # Optional: retry on failure
        raise
