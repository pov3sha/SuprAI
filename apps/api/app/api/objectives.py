import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.base import get_db, SessionLocal
from app.models.schema import Conversation
from app.services.manager.orchestrator import manager_orchestrator

router = APIRouter()

class ObjectiveRequest(BaseModel):
    prompt: str

def run_objective_background(conversation_id: str, prompt: str, execution_id: str):
    db = SessionLocal()
    try:
        manager_orchestrator.process_objective(conversation_id, prompt, db, execution_id=execution_id)
    except Exception as e:
        print(f"Background objective processing error: {e}")
    finally:
        db.close()

@router.post("/conversations/{conversation_id}/objectives", status_code=status.HTTP_202_ACCEPTED)
async def submit_objective(
    conversation_id: str,
    dto: ObjectiveRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    execution_id = str(uuid.uuid4())
    background_tasks.add_task(run_objective_background, conversation_id, dto.prompt, execution_id)

    return {
        "status": "accepted",
        "execution_id": execution_id,
        "conversation_id": conversation_id,
        "message": "Objective queued for execution."
    }
