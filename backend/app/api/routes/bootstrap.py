import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api._dashboard_helpers import (
    dashboard_etag,
    dashboard_snapshot_or_empty,
    has_meaningful_dashboard_data,
)
from app.api.deps import get_current_user
from app.api.routes.config import get_constants
from app.db.session import get_db
from app.services import dashboard_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/bootstrap")
async def get_bootstrap(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Single round-trip: dashboard snapshot + shared boards + config constants."""
    from app.cache import get_cached_dashboard, set_cached_dashboard

    dashboard = None
    try:
        cached = await get_cached_dashboard(user_id)
        if has_meaningful_dashboard_data(cached):
            updated_at = datetime.now(timezone.utc)
            etag = dashboard_etag(user_id, cached)
            if request.headers.get("if-none-match") == etag:
                response.headers["ETag"] = etag
                return Response(status_code=304, headers={"ETag": etag})
            response.headers["ETag"] = etag
            dashboard = {"key": "default", "data": cached, "updated_at": updated_at}
        else:
            data, updated_at = await dashboard_service.get_dashboard_with_meta(db, user_id=user_id)
            await set_cached_dashboard(data, user_id)
            etag = dashboard_etag(user_id, data, updated_at)
            if request.headers.get("if-none-match") == etag:
                return Response(status_code=304, headers={"ETag": etag})
            response.headers["ETag"] = etag
            dashboard = {
                "key": "default",
                "data": dashboard_snapshot_or_empty(data),
                "updated_at": updated_at or datetime.now(timezone.utc),
            }
    except Exception as e:
        logger.exception("bootstrap dashboard failed: %s", e)
        dashboard = None

    try:
        shared = await dashboard_service.get_all_shared_dashboards(db)
    except Exception:
        shared = []

    config = await get_constants()
    return {
        "dashboard": dashboard,
        "shared_dashboards": shared or [],
        "config": config,
    }
