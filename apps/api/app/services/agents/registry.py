from typing import List, Optional
from sqlalchemy.orm import Session
from loguru import logger
from app.models.schema import AgentWorker
from app.core.config import settings

def get_role_model(role_name: str) -> str:
    provider = settings.get_role_provider(role_name)
    return settings.get_role_model(role_name, provider)

ORGANIZATION_ROLES = [
    {
        "name": "Consultant",
        "provider": "Ollama",
        "role": "Consultant",
        "capabilities": ["strategy", "planning", "domain_reasoning", "pipeline_design"],
    },
    {
        "name": "Analyst",
        "provider": "Ollama",
        "role": "Analyst",
        "capabilities": ["document_analysis", "financial_analysis", "quantitative_reasoning"],
    },
    {
        "name": "Researcher",
        "provider": "Ollama",
        "role": "Researcher",
        "capabilities": ["research", "evidence_gathering", "source_analysis"],
    }
]

def seed_role_workers(db: Session):
    """
    Ensures role workers (Consultant, Analyst, Researcher) exist in database with configured models.
    """
    for r_data in ORGANIZATION_ROLES:
        existing = db.query(AgentWorker).filter(AgentWorker.name == r_data["name"]).first()
        w_model = get_role_model(r_data["role"])
        if not existing:
            w_rec = AgentWorker(
                name=r_data["name"],
                provider="Ollama",
                model=w_model,
                capabilities=r_data["capabilities"],
                status="AVAILABLE"
            )
            db.add(w_rec)
        else:
            existing.model = w_model
            existing.capabilities = r_data["capabilities"]
            existing.status = "AVAILABLE"
    db.commit()

def select_worker_for_capabilities(required_capabilities: List[str], db: Session) -> Optional[AgentWorker]:
    seed_role_workers(db)
    workers = db.query(AgentWorker).filter(AgentWorker.status == "AVAILABLE").all()

    if not workers:
        return None

    if not required_capabilities:
        return workers[0]

    best_worker = None
    best_score = -1

    for worker in workers:
        worker_caps = set(worker.capabilities or [])
        req_caps = set(required_capabilities)
        overlap = len(worker_caps.intersection(req_caps))
        if overlap > best_score:
            best_score = overlap
            best_worker = worker

    return best_worker or workers[0]
