from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.schema import Conversation, Task, Evidence

router = APIRouter()

@router.get("/conversations/{conversation_id}", tags=["Conversations"])
def get_conversation_history(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat()
        }
        for m in conversation.messages
    ]

    tasks = db.query(Task).filter(Task.conversation_id == conversation_id).all()
    task_list = [
        {
            "id": t.id,
            "objective": t.objective,
            "status": t.status.value,
            "capabilities": t.required_capabilities,
            "worker": t.worker.name if t.worker else "Unassigned",
            "provider": t.worker.provider if t.worker else "Pending"
        }
        for t in tasks
    ]

    evidence_items = db.query(Evidence).join(Task).filter(Task.conversation_id == conversation_id).all()
    evidence_list = [
        {
            "id": e.id,
            "claim": e.claim,
            "excerpt": e.excerpt,
            "page_number": e.page_number,
            "verification_status": e.verification_status.value,
            "document_name": e.document.filename if e.document else "Document"
        }
        for e in evidence_items
    ]

    return {
        "id": conversation.id,
        "title": conversation.title,
        "project_id": conversation.project_id,
        "messages": messages,
        "tasks": task_list,
        "evidence": evidence_list
    }
