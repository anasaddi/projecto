from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app import schemas, crud
from app.api.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])

@router.get("/source/{source_id}", response_model=schemas.ContentOut)
async def get_content_by_source(source_id: int, db: AsyncSession = Depends(get_db)):
    content = await crud.get_content_by_source(db, source_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@router.get("/{content_id}", response_model=schemas.ContentOut)
async def get_content(content_id: int, db: AsyncSession = Depends(get_db)):
    content = await crud.get_content(db, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content
