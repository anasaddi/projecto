from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app import schemas, crud

router = APIRouter()

@router.post("/", response_model=schemas.InsightOut)
async def create_insight(data: schemas.InsightCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_insight(db, data)

@router.get("/", response_model=list[schemas.InsightOut])
async def list_insights(content_id: int | None = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.list_insights(db, content_id=content_id, skip=skip, limit=limit)

@router.put("/{insight_id}", response_model=schemas.InsightOut)
async def update_insight(insight_id: int, data: schemas.InsightUpdate, db: AsyncSession = Depends(get_db)):
    insight = await crud.update_insight(db, insight_id, data)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight

@router.delete("/{insight_id}")
async def delete_insight(insight_id: int, db: AsyncSession = Depends(get_db)):
    await crud.delete_insight(db, insight_id)
    return {"status": "ok"}
