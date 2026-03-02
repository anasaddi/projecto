from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app import schemas, crud

router = APIRouter()


@router.get("/by-source/{source_id}", response_model=schemas.ContentOut | None)
def get_content_by_source(source_id: int, db: Session = Depends(get_db)):
    return crud.get_content_by_source(db, source_id)


@router.get("/{content_id}", response_model=schemas.ContentOut)
def get_content(content_id: int, db: Session = Depends(get_db)):
    content = crud.get_content(db, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content
