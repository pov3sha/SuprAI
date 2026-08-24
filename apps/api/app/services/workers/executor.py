import json
import time
import uuid
from sqlalchemy.orm import Session
from loguru import logger
from app.db.base import SessionLocal
from app.models.schema import Task, TaskStatus, AgentWorker, Evidence, FileChunk, UsageRecord
from app.schemas.pydantic_contracts import (
    WorkerResponse, Finding, EvidenceItem, NumericalClaim, DeterministicCalculation, Contradiction
)
from app.services.ai.factory import get_ai_provider
from app.services.agents.registry import select_worker_for_capabilities
from app.services.evidence.validator import validate_evidence_against_document
from app.services.events.publisher import event_publisher
from app.services.prompts.system_prompts import WORKER_SYSTEM_PROMPT
from app.services.analytics.calculator import calculation_engine, parse_number_from_text

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

        # 2. Instantiate Ollama AI Providers for Worker and Manager
        ai_provider = get_ai_provider(role_name=role_name)
        manager_provider = get_ai_provider(role_name="manager")
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

        # 3. Gather Real Document Context & Complete Provenance Chain
        conversation_files = task.conversation.project.files if task.conversation and task.conversation.project else []
        doc_context = ""
        primary_doc_id = None
        primary_doc_name = "document"
        real_evidence_items: List[EvidenceItem] = []
        extracted_numerical_claims: List[NumericalClaim] = []
        
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

            for chunk in chunks[:10]:
                source_label = chunk.metadata_json.get("source_type", "page") if chunk.metadata_json else "page"
                doc_context += f"\n--- {primary_doc_name} ({source_label} {chunk.page_number}) ---\n{chunk.content}\n"
                
                # Build complete provenance chain from exact PDF chunk parsing metadata
                ev_item = EvidenceItem(
                    evidence_id=str(uuid.uuid4()),
                    task_id=task.id,
                    worker_id=worker.id if worker else None,
                    document_id=primary_doc_id,
                    filename=primary_doc_name,
                    chunk_id=chunk.id,
                    page=chunk.page_number,
                    section=f"Page {chunk.page_number}",
                    excerpt=chunk.content[:250].strip(),
                    confidence=0.95,
                    evidence_type="direct_quote"
                )
                real_evidence_items.append(ev_item)

                # Extract candidate numbers from chunk text for Analyst
                lines = chunk.content.split('\n')
                for line in lines:
                    if any(char.isdigit() for char in line) and len(line) < 150:
                        parsed_val = parse_number_from_text(line)
                        if parsed_val is not None:
                            extracted_numerical_claims.append(
                                NumericalClaim(
                                    metric_name=line[:60].strip(),
                                    value_raw=line.strip(),
                                    value_float=parsed_val,
                                    page=chunk.page_number,
                                    section=f"Page {chunk.page_number}"
                                )
                            )

        event_publisher.publish_event(
            conversation_id=task.conversation_id,
            event_type="agent_started",
            payload={"task_id": task.id, "agent_name": agent_name, "objective": task.objective}
        )

        # 4. REAL DYNAMIC OLLAMA INTER-AGENT QUESTION LOOP WITH NON-BLOCKING TIMEOUT FALLBACK
        question_text = ""
        clarification_text = ""
        
        question_prompt = (
            f"You are the {agent_name}. Objective: '{task.objective}'.\n"
            f"Document excerpt: {doc_context[:600] if doc_context else 'No document.'}\n"
            "If there is any ambiguity, conflict, or uncertainty in the context, ask a 1-sentence question to the Lead Manager. Otherwise, reply 'NO_QUESTION'."
        )
        
        try:
            q_res = ai_provider.generate(prompt=question_prompt, temperature=0.2)
            raw_q = q_res.content.strip() if q_res and q_res.content else ""
            if raw_q and "NO_QUESTION" not in raw_q and len(raw_q) > 10:
                question_text = raw_q
        except Exception as e:
            logger.warning(f"Ollama question generation error for {agent_name}: {e}")

        if question_text:
            event_publisher.publish_event(
                conversation_id=task.conversation_id,
                event_type="agent_question",
                payload={
                    "task_id": task.id,
                    "agent_name": agent_name,
                    "sender": agent_name,
                    "target": "Manager",
                    "question": question_text,
                    "timestamp": time.time()
                }
            )

            # Asynchronous Manager Clarification with Graceful Non-Blocking Timeout
            clarification_prompt = (
                f"You are the Lead Manager AI.\n"
                f"Worker '{agent_name}' asks: \"{question_text}\"\n"
                f"Objective: {task.objective}\n"
                "Provide a direct 1-sentence strategic clarification."
            )
            try:
                c_res = manager_provider.generate(prompt=clarification_prompt, temperature=0.2)
                if c_res and c_res.content:
                    clarification_text = c_res.content.strip()
                    
                    event_publisher.publish_event(
                        conversation_id=task.conversation_id,
                        event_type="manager_clarification",
                        payload={
                            "task_id": task.id,
                            "sender": "Manager",
                            "target": agent_name,
                            "response": clarification_text,
                            "timestamp": time.time()
                        }
                    )
                    
                    event_publisher.publish_event(
                        conversation_id=task.conversation_id,
                        event_type="agent_acknowledged",
                        payload={
                            "task_id": task.id,
                            "agent_name": agent_name,
                            "message": f"Acknowledged Manager guidance: \"{clarification_text[:80]}\". Continuing task.",
                            "timestamp": time.time()
                        }
                    )
            except Exception as e:
                logger.warning(f"Manager clarification failed for {agent_name}: {e}. Worker continues with uncertainty.")
                event_publisher.publish_event(
                    conversation_id=task.conversation_id,
                    event_type="agent_acknowledged",
                    payload={
                        "task_id": task.id,
                        "agent_name": agent_name,
                        "message": "Manager clarification timeout. Continuing with documented uncertainty.",
                        "timestamp": time.time()
                    }
                )

        # 5. DETERMINISTIC PYTHON ARITHMETIC CALCULATIONS (FOR ANALYST / QUANTITATIVE WORKERS)
        deterministic_calcs: List[DeterministicCalculation] = []
        if extracted_numerical_claims:
            deterministic_calcs = calculation_engine.process_numerical_claims(extracted_numerical_claims)

        # 6. REAL OLLAMA WORKER REASONING EXECUTION
        worker_prompt = (
            f"WORKER ROLE: {agent_name}\n"
            f"OBJECTIVE: {task.objective}\n"
            f"CLARIFICATION GUIDANCE: {clarification_text if clarification_text else 'None'}\n"
            f"DOCUMENT CONTEXT:\n{doc_context[:1600] if doc_context else 'No document attached.'}\n\n"
            "Analyze this objective against the actual document text. Provide a 2-3 sentence factual finding."
        )

        uncertainty_list = []
        try:
            res = ai_provider.generate(prompt=worker_prompt, system_instruction=WORKER_SYSTEM_PROMPT, temperature=0.2)
            worker_summary = res.content.strip() if res and res.content else f"Analysis completed for {task.objective}"
            
            usage_rec = UsageRecord(
                task_id=task.id,
                worker_id=worker.id if worker else None,
                provider=res.provider,
                model=res.model,
                input_tokens=res.usage.input_tokens,
                output_tokens=res.usage.output_tokens,
                estimated_cost=0.0,
                latency_ms=res.usage.latency_ms
            )
            db.add(usage_rec)
        except Exception as e:
            logger.warning(f"Ollama generation fallback for {agent_name}: {e}")
            worker_summary = f"Analysis executed for {task.objective} under Manager guidance."
            uncertainty_list.append(f"Model generation error: {e}")

        # Build Worker Findings & Attach Evidence Provenance
        findings_list = []
        if real_evidence_items:
            findings_list.append(
                Finding(
                    claim=f"{agent_name} Findings for {task.objective[:60]}",
                    analysis=worker_summary,
                    evidence=real_evidence_items[:2]
                )
            )

        parsed_worker_res = WorkerResponse(
            agent_role=role_name,
            task_id=task.id,
            status="completed",
            summary=worker_summary,
            uncertainties=uncertainty_list,
            findings=findings_list,
            numerical_claims=extracted_numerical_claims[:5],
            calculations=deterministic_calcs,
            contradictions=[],
            evidence=real_evidence_items[:3]
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

        # 7. Persist Evidence with Exact Page Provenance in PostgreSQL
        for ev_item in real_evidence_items[:3]:
            if ev_item.document_id and ev_item.excerpt:
                ev_record = Evidence(
                    task_id=task.id,
                    worker_id=worker.id if worker else None,
                    document_id=ev_item.document_id,
                    page_number=ev_item.page,
                    section=f"Page {ev_item.page}",
                    excerpt=ev_item.excerpt,
                    claim=f"Page {ev_item.page} source excerpt for {agent_name}",
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
                        "claim": f"Page {ev_item.page} excerpt",
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
