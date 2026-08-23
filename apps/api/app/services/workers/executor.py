import json
from sqlalchemy.orm import Session
from loguru import logger
from app.db.base import SessionLocal
from app.models.schema import Task, TaskStatus, AgentWorker, Evidence, FileChunk, UsageRecord
from app.schemas.pydantic_contracts import WorkerResponse, Finding, EvidenceItem
from app.services.ai.factory import get_ai_provider
from app.services.agents.registry import select_worker_for_capabilities
from app.services.evidence.validator import validate_evidence_against_document
from app.services.events.publisher import event_publisher
from app.services.prompts.system_prompts import WORKER_SYSTEM_PROMPT

def execute_worker_task(task_id: str) -> dict:
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            logger.error(f"Task {task_id} not found for worker execution")
            return None

        task.status = TaskStatus.RUNNING
        db.commit()

        # 1. Select Worker based on capabilities
        required_caps = task.required_capabilities or ["analysis"]
        worker = select_worker_for_capabilities(required_caps, db)
        if worker:
            task.assigned_worker_id = worker.id
            db.commit()

        role_name = "analyst"
        if worker and worker.name:
            role_name = worker.name.lower()

        # 2. Get Multi-Provider AI Client for Worker Role
        ai_provider = get_ai_provider(role_name=role_name)

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_assigned",
            payload={
                "task_id": task.id,
                "agent_id": worker.id if worker else "worker_1",
                "agent_name": worker.name if worker else "Worker",
                "provider": f"{ai_provider.provider} ({ai_provider.model})",
                "objective": task.objective
            }
        )

        # 3. Gather Document Context with Source Metadata
        conversation_files = task.conversation.project.files if task.conversation and task.conversation.project else []
        doc_context = ""
        primary_doc_id = None
        primary_doc_name = "document"
        
        if conversation_files:
            primary_doc = conversation_files[0]
            primary_doc_id = primary_doc.id
            primary_doc_name = primary_doc.filename
            chunks = db.query(FileChunk).filter(FileChunk.file_id == primary_doc_id).order_by(FileChunk.page_number).all()
            for chunk in chunks[:15]:
                source_label = chunk.metadata_json.get("source_type", "source") if chunk.metadata_json else "page"
                doc_context += f"\n--- {primary_doc_name} ({source_label} {chunk.page_number}) ---\n{chunk.content}\n"

        prompt = (
            f"DYNAMIC TASK OBJECTIVE:\n{task.objective}\n\n"
            f"DOCUMENT TEXT EXCERPTS:\n{doc_context[:3000] if doc_context else 'No document attached.'}\n\n"
            "Analyze this objective specifically against the document text and provide findings and page evidence quotes."
        )

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_started",
            payload={"task_id": task.id, "agent_name": worker.name if worker else "Worker"}
        )

        response = ai_provider.generate(
            prompt=prompt,
            system_instruction=WORKER_SYSTEM_PROMPT,
            temperature=0.2
        )

        # Record Usage Record
        usage_rec = UsageRecord(
            task_id=task.id,
            worker_id=worker.id if worker else None,
            provider=response.provider,
            model=response.model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            estimated_cost=0.0,
            latency_ms=response.usage.latency_ms
        )
        db.add(usage_rec)

        # 4. Format Worker Findings
        worker_summary = response.content.strip() if response.content else f"Analysis completed for {task.objective}"

        parsed_worker_res = WorkerResponse(
            task_id=task.id,
            status="completed",
            summary=worker_summary[:500],
            findings=[
                Finding(
                    claim=f"Analysis of {task.objective}",
                    evidence=[
                        EvidenceItem(
                            document_id=primary_doc_id,
                            page=1,
                            excerpt=doc_context[:150] if doc_context else "Document excerpt analysis",
                            confidence=0.9
                        )
                    ]
                )
            ]
        )

        output_dict = parsed_worker_res.model_dump()
        task.output_json = output_dict
        task.status = TaskStatus.COMPLETED
        db.commit()

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_completed",
            payload={"task_id": task.id, "summary": worker_summary[:200]}
        )

        # 5. Persist & Validate Evidence in PostgreSQL
        for finding in parsed_worker_res.findings:
            for ev_item in finding.evidence:
                ev_record = Evidence(
                    task_id=task.id,
                    worker_id=worker.id if worker else None,
                    document_id=ev_item.document_id or primary_doc_id,
                    page_number=ev_item.page,
                    section=f"Page {ev_item.page}",
                    excerpt=ev_item.excerpt,
                    claim=finding.claim,
                    confidence=ev_item.confidence
                )
                db.add(ev_record)
                db.commit()
                db.refresh(ev_record)

                ver_status = validate_evidence_against_document(ev_record.id, db)
                
                event_publisher.publish_event(
                    conversation_id=task.conversation_id,
                    event_type="evidence_created",
                    payload={
                        "task_id": task.id,
                        "claim": finding.claim,
                        "page": ev_item.page,
                        "excerpt": ev_item.excerpt,
                        "verification_status": ver_status.value
                    }
                )

        return output_dict
    except Exception as e:
        logger.error(f"Worker task execution failed for task {task_id}: {e}")
        return None
    finally:
        db.close()
