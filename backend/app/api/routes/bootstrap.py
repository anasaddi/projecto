import logging

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.routes.config import get_constants
from app.db.session import get_db
from app.services import dashboard_service
from app.services.dashboard_read import dashboard_read_to_response, read_dashboard_for_client

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
    dashboard = None
    try:
        result = await read_dashboard_for_client(
            db,
            user_id=user_id,
            if_none_match=request.headers.get("if-none-match"),
            log_label="bootstrap_dashboard",
        )
        if result.not_modified:
            response.headers["ETag"] = result.etag
            return Response(status_code=304, headers={"ETag": result.etag})
        response.headers["ETag"] = result.etag
        dashboard = dashboard_read_to_response(result)
    except Exception as e:
        logger.exception("bootstrap dashboard failed: %s", e)
        dashboard = None

    shared = None
    try:
        shared = await dashboard_service.get_all_shared_dashboards(db)
    except Exception as e:
        logger.exception("bootstrap shared dashboards failed: %s", e)

    config = await get_constants()
    return {
        "dashboard": dashboard,
        "shared_dashboards": shared if shared is not None else [],
        "config": config,
    }
