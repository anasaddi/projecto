from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app import schemas, crud
from app.api.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])

@router.post("/", response_model=schemas.InsightOut)
async def create_insight(data: schemas.InsightCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_insight(db, data)

@router.get("/", response_model=list[schemas.InsightOut])
async def list_insights(content_id: int | None = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.list_insights(db, content_id=content_id, skip=skip, limit=limit)

@router.get("/{insight_id}", response_model=schemas.InsightOut)
async def get_insight(insight_id: int, db: AsyncSession = Depends(get_db)):
    insight = await crud.get_insight(db, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight

@router.patch("/{insight_id}", response_model=schemas.InsightOut)
async def update_insight(insight_id: int, data: schemas.InsightUpdate, db: AsyncSession = Depends(get_db)):
    insight = await crud.update_insight(db, insight_id, data)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight

@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(insight_id: int, db: AsyncSession = Depends(get_db)):
    await crud.delete_insight(db, insight_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
