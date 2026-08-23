import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.schema import FileRecord, Project
from app.services.files.storage import storage_service
from app.services.files.processor import process_uploaded_document

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".csv", ".json", ".txt", ".md"}

@router.post("/projects/{project_id}/files")
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.filename}")

    contents = await file.read()
    storage_path = f"{project_id}/{file.filename}"

    # Upload via Storage Service
    storage_service.upload_file(contents, storage_path, content_type=file.content_type or "application/octet-stream")

    file_record = FileRecord(
        project_id=project_id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
        status="UPLOADED"
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    try:
        processed_rec = process_uploaded_document(file_record.id, db)
        return {
            "id": processed_rec.id,
            "filename": processed_rec.filename,
            "size_bytes": processed_rec.size_bytes,
            "page_count": processed_rec.page_count,
            "status": processed_rec.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
