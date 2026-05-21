from app.repositories import dashboard as dashboard_repo
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Tuple
from datetime import datetime

async def get_dashboard(db: AsyncSession, key: str = "default", user_id: str | None = None) -> Dict[str, Any]:
    data, _ = await dashboard_repo.get_dashboard_document(db, key, user_id)
    return data

async def get_dashboard_with_meta(
    db: AsyncSession, key: str = "default", user_id: str | None = None
) -> Tuple[Dict[str, Any], datetime | None]:
    return await dashboard_repo.get_dashboard_document(db, key, user_id)

async def update_dashboard(db: AsyncSession, data: dict, key: str = "default", user_id: str | None = None) -> Dict[str, Any]:
    return await dashboard_repo.update_dashboard_from_json(db, data, key, user_id)

async def get_shared_dashboard(db: AsyncSession, share_id: str) -> Dict[str, Any] | None:
    return await dashboard_repo.get_shared_dashboard_aggregated(db, share_id)

async def update_shared_dashboard(db: AsyncSession, share_id: str, data: dict, title: str | None = None) -> Dict[str, Any]:
    return await dashboard_repo.update_shared_dashboard_from_json(db, share_id, data, title)

async def get_all_shared_dashboards(db: AsyncSession) -> List[Dict[str, Any]]:
    return await dashboard_repo.get_all_shared_dashboards_aggregated(db)

async def add_chat_msg(db: AsyncSession, share_id: str, msg_data: dict) -> Dict[str, Any]:
    return await dashboard_repo.add_chat_message(db, share_id, msg_data)
