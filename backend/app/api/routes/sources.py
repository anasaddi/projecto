from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app import schemas, crud

router = APIRouter()

@router.post("/", response_model=schemas.SourceOut)
async def create_source(
    file: UploadFile | None = File(None),
    url: str | None = Form(None),
    tipo: str = Form(...),
    title: str | None = Form(None),
    trust_score: int = Form(7),
    db: AsyncSession = Depends(get_db),
):
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide either file or url")
    return await crud.create_source(db, file=file, url=url, tipo=tipo, title=title, trust_score=trust_score)

@router.get("/", response_model=list[schemas.SourceOut])
async def list_sources(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await crud.list_sources(db, skip=skip, limit=limit)

@router.get("/{source_id}", response_model=schemas.SourceOut)
async def get_source(source_id: int, db: AsyncSession = Depends(get_db)):
    source = await crud.get_source(db, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source
