from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.base import get_db
from app.models.schema import Project, Conversation
from app.schemas.pydantic_contracts import CreateProjectDTO

router = APIRouter()

@router.post("/projects", tags=["Projects"])
def create_project(dto: CreateProjectDTO, db: Session = Depends(get_db)):
    project = Project(name=dto.name, description=dto.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Create default conversation
    conversation = Conversation(project_id=project.id, title=f"{project.name} Chat")
    db.add(conversation)
    db.commit()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "default_conversation_id": conversation.id
    }

@router.get("/projects", tags=["Projects"])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    res = []
    for p in projects:
        default_conv = p.conversations[0] if p.conversations else None
        res.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "default_conversation_id": default_conv.id if default_conv else None,
            "file_count": len(p.files)
        })
    return res

@router.get("/projects/{project_id}", tags=["Projects"])
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    default_conv = project.conversations[0] if project.conversations else None
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "default_conversation_id": default_conv.id if default_conv else None,
        "files": [{"id": f.id, "filename": f.filename, "size": f.size, "page_count": f.page_count} for f in project.files]
    }

@router.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"status": "deleted", "id": project_id}

@router.delete("/projects", tags=["Projects"])
def delete_all_projects(db: Session = Depends(get_db)):
    try:
        db.execute(text("TRUNCATE TABLE projects, conversations, messages, files, file_chunks, tasks, evidence, usage_records CASCADE;"))
        db.commit()
    except Exception:
        db.rollback()
        projects = db.query(Project).all()
        for p in projects:
            db.delete(p)
        db.commit()
    return {"status": "cleared"}
