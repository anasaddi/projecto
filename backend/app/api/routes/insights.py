from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app import schemas, crud

router = APIRouter()


@router.post("/", response_model=schemas.InsightOut)
def create_insight(data: schemas.InsightCreate, db: Session = Depends(get_db)):
    return crud.create_insight(db, data)


@router.get("/", response_model=list[schemas.InsightOut])
def list_insights(content_id: int | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_insights(db, content_id=content_id, skip=skip, limit=limit)


@router.get("/{insight_id}", response_model=schemas.InsightOut)
def get_insight(insight_id: int, db: Session = Depends(get_db)):
    insight = crud.get_insight(db, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight


@router.patch("/{insight_id}", response_model=schemas.InsightOut)
def update_insight(insight_id: int, data: schemas.InsightUpdate, db: Session = Depends(get_db)):
    updated = crud.update_insight(db, insight_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Insight not found")
    return updated


@router.delete("/{insight_id}", status_code=204)
def delete_insight(insight_id: int, db: Session = Depends(get_db)):
    insight = crud.get_insight(db, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    crud.delete_insight(db, insight_id)
