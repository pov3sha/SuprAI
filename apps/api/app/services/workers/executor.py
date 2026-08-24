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

        # 2. Get Ollama AI Client for Worker Role
        ai_provider = get_ai_provider(role_name=role_name)
        agent_name = worker.name if worker else "Worker"

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_assigned",
            payload={
                "task_id": task.id,
                "agent_id": worker.id if worker else "worker_1",
                "agent_name": agent_name,
                "provider": f"{ai_provider.provider} ({ai_provider.model})",
                "objective": task.objective
            }
        )

        # 3. Gather Real Document Context with Source Metadata
        conversation_files = task.conversation.project.files if task.conversation and task.conversation.project else []
        doc_context = ""
        primary_doc_id = None
        primary_doc_name = "document"
        real_evidence_items = []
        
        if conversation_files:
            primary_doc = conversation_files[0]
            primary_doc_id = primary_doc.id
            primary_doc_name = primary_doc.filename
            chunks = db.query(FileChunk).filter(FileChunk.file_id == primary_doc_id).order_by(FileChunk.page_number).all()
            
            if chunks:
                event_publisher.publish_event(
                    conversation_id=task.conversation_id,
                    event_type="document_reading",
                    payload={
                        "task_id": task.id,
                        "agent_name": agent_name,
                        "filename": primary_doc_name,
                        "page": chunks[0].page_number,
                        "snippet": chunks[0].content[:150]
                    }
                )

            for chunk in chunks[:15]:
                source_label = chunk.metadata_json.get("source_type", "page") if chunk.metadata_json else "page"
                doc_context += f"\n--- {primary_doc_name} ({source_label} {chunk.page_number}) ---\n{chunk.content}\n"
                
                # Capture actual evidence item from real text chunk
                real_evidence_items.append(
                    EvidenceItem(
                        document_id=primary_doc_id,
                        page=chunk.page_number,
                        excerpt=chunk.content[:200],
                        confidence=0.95
                    )
                )

        prompt = (
            f"WORKER OBJECTIVE:\n{task.objective}\n\n"
            f"REAL DOCUMENT EXCERPTS:\n{doc_context[:3500] if doc_context else 'No document attached.'}\n\n"
            "Analyze this objective against the actual text excerpts and provide a concise, factual summary."
        )

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_started",
            payload={"task_id": task.id, "agent_name": agent_name, "objective": task.objective}
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

        # 4. Format Real Worker Findings
        worker_summary = response.content.strip() if response.content else f"Analysis completed for {task.objective}"

        findings_list = []
        if real_evidence_items:
            findings_list.append(
                Finding(
                    claim=f"Analysis of {task.objective[:80]}",
                    evidence=real_evidence_items[:3]
                )
            )

        parsed_worker_res = WorkerResponse(
            task_id=task.id,
            status="completed",
            summary=worker_summary,
            findings=findings_list
        )

        output_dict = parsed_worker_res.model_dump()
        task.output_json = output_dict
        task.status = TaskStatus.COMPLETED
        db.commit()

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_completed",
            payload={"task_id": task.id, "agent_name": agent_name, "summary": worker_summary[:200]}
        )

        # 5. Persist & Validate Real Evidence in PostgreSQL
        for finding in parsed_worker_res.findings:
            for ev_item in finding.evidence:
                if ev_item.document_id and ev_item.excerpt:
                    ev_record = Evidence(
                        task_id=task.id,
                        worker_id=worker.id if worker else None,
                        document_id=ev_item.document_id,
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
                            "agent_name": agent_name,
                            "document_name": primary_doc_name,
                            "claim": finding.claim,
                            "page": ev_item.page,
                            "excerpt": ev_item.excerpt,
                            "verification_status": ver_status.value
                        }
                    )

        return output_dict
    except Exception as e:
        logger.error(f"Worker task execution failed for task {task_id}: {e}")
        event_publisher.publish_event(
            conversation_id=task.conversation_id if task else "unknown",
            event_type="agent_failed",
            payload={"task_id": task_id, "error": str(e)}
        )
        return None
    finally:
        db.close()
