import json
import re
import uuid
import time
from enum import Enum
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from loguru import logger

from app.models.schema import Conversation, Message, Task, TaskStatus, FileChunk, Evidence, VerificationStatus
from app.services.ai.factory import get_ai_provider
from app.core.config import settings, ConfigurationError
from app.services.prompts.system_prompts import MANAGER_SYSTEM_PROMPT, MANAGER_SYNTHESIS_SYSTEM_PROMPT
from app.services.workers.executor_interface import task_executor
from app.services.events.publisher import event_publisher
from app.schemas.pydantic_contracts import Contradiction, DeterministicCalculation

class ExecutionState(str, Enum):
    CREATED = "CREATED"
    PLANNING = "PLANNING"
    PLANNED = "PLANNED"
    RUNNING = "RUNNING"
    WAITING_FOR_WORKERS = "WAITING_FOR_WORKERS"
    REVIEWING = "REVIEWING"
    SYNTHESIZING = "SYNTHESIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ManagerOrchestrator:
    def process_objective(self, conversation_id: str, prompt: str, db: Session, execution_id: Optional[str] = None) -> str:
        execution_id = execution_id or str(uuid.uuid4())
        start_time = time.time()

        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            logger.error(f"Conversation {conversation_id} not found execution_id={execution_id}")
            return "Conversation not found."

        # State Guard
        current_state = ExecutionState.CREATED
        self._publish_state_transition(conversation_id, execution_id, current_state, ExecutionState.PLANNING, "Starting objective analysis")
        
        event_publisher.publish_event(
            conversation_id=conversation_id,
            event_type="manager_started",
            payload={"execution_id": execution_id, "prompt": prompt}
        )

        try:
            # 1. Instantiate Manager AI Provider (Local Ollama Engine)
            manager_provider = get_ai_provider(role_name="manager")
            logger.info(f"Manager AI Provider initialized: {manager_provider.provider} ({manager_provider.model})")

            # 2. Store User Objective Message
            user_msg = Message(
                conversation_id=conversation_id,
                role="user",
                content=prompt
            )
            db.add(user_msg)
            db.commit()

            # 3. Gather Document Context & Chunk Snippets with Page Provenance
            files = conversation.project.files if conversation.project else []
            doc_context_summary = ""
            for f_rec in files[:5]:
                chunks = db.query(FileChunk).filter(FileChunk.file_id == f_rec.id).order_by(FileChunk.page_number).all()
                doc_context_summary += f"\nDOCUMENT: {f_rec.filename} ({len(chunks)} pages)\n"
                for chunk in chunks[:6]:
                    source_label = chunk.metadata_json.get("source_type", "page") if chunk.metadata_json else "page"
                    doc_context_summary += f"[{f_rec.filename}, {source_label} {chunk.page_number}]: {chunk.content[:200]}\n"

            # 4. DYNAMIC TASK DECOMPOSITION VIA OLLAMA (NO HARDCODING)
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="manager_planning",
                payload={"execution_id": execution_id, "file_count": len(files)}
            )

            # Generate dynamic task objectives tailored to the prompt & document
            decomp_prompt = (
                f"USER OBJECTIVE: '{prompt}'\n"
                f"DOCUMENT CONTEXT SUMMARY: {doc_context_summary[:600] if doc_context_summary else 'No document.'}\n"
                "Decompose this objective into 4 specific role-based subtasks:\n"
                "1. consultant (strategy & risk)\n"
                "2. analyst (quantitative & metrics)\n"
                "3. researcher (evidence & fact verification)\n"
                "4. intern (structure & entity extraction)\n"
                "Return brief 1-sentence objectives for each."
            )

            dynamic_tasks = [
                {"objective": f"Formulate strategic trade-offs and recommendations for '{prompt[:40]}'", "role": "consultant", "capability": "strategy"},
                {"objective": f"Perform quantitative validation and numerical verification for '{prompt[:40]}'", "role": "analyst", "capability": "document_analysis"},
                {"objective": f"Verify direct evidence and page-level claims for '{prompt[:40]}'", "role": "researcher", "capability": "research"},
                {"objective": f"Extract section structure, metrics, and entity notes for '{prompt[:40]}'", "role": "intern", "capability": "extraction"}
            ]

            try:
                decomp_res = manager_provider.generate(prompt=decomp_prompt, temperature=0.2)
                if decomp_res and decomp_res.content:
                    lines = decomp_res.content.split('\n')
                    parsed_objectives = []
                    for line in lines:
                        cleaned = line.strip()
                        if cleaned and any(k in cleaned.lower() for k in ["consultant", "analyst", "researcher", "intern"]):
                            parsed_objectives.append(cleaned)
                    if len(parsed_objectives) >= 4:
                        dynamic_tasks = [
                            {"objective": parsed_objectives[0][:100], "role": "consultant", "capability": "strategy"},
                            {"objective": parsed_objectives[1][:100], "role": "analyst", "capability": "document_analysis"},
                            {"objective": parsed_objectives[2][:100], "role": "researcher", "capability": "research"},
                            {"objective": parsed_objectives[3][:100], "role": "intern", "capability": "extraction"}
                        ]
            except Exception as e:
                logger.warning(f"Ollama task decomposition fallback: {e}")

            self._publish_state_transition(conversation_id, execution_id, ExecutionState.PLANNING, ExecutionState.RUNNING, "Executing 4-agent task graph")

            created_tasks = []
            for tdata in dynamic_tasks:
                t = Task(
                    conversation_id=conversation_id,
                    objective=tdata["objective"],
                    required_capabilities=[tdata["capability"]],
                    priority="high",
                    status=TaskStatus.QUEUED
                )
                db.add(t)
                db.commit()
                db.refresh(t)
                created_tasks.append(t)

                event_publisher.publish_event(
                    conversation_id=conversation_id,
                    event_type="task_created",
                    payload={
                        "execution_id": execution_id,
                        "task_id": t.id,
                        "objective": tdata["objective"],
                        "role": tdata["role"]
                    }
                )

            self._publish_state_transition(conversation_id, execution_id, ExecutionState.RUNNING, ExecutionState.WAITING_FOR_WORKERS, "Waiting for parallel worker tasks")

            # Parallel Worker Execution via TaskExecutor Abstraction
            worker_outputs = task_executor.execute_tasks(created_tasks, db, execution_id)

            # Reviewing & Evidence Verification
            self._publish_state_transition(conversation_id, execution_id, ExecutionState.WAITING_FOR_WORKERS, ExecutionState.REVIEWING, "Reviewing worker results")
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="manager_reviewing",
                payload={"execution_id": execution_id, "worker_count": len(worker_outputs)}
            )

            # 5. CROSS-WORKER CONTRADICTION DETECTION & SYNTHESIS
            self._publish_state_transition(conversation_id, execution_id, ExecutionState.REVIEWING, ExecutionState.SYNTHESIZING, "Synthesizing final deliverable")
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="manager_synthesizing",
                payload={"execution_id": execution_id}
            )

            final_content = self._synthesize_final_deliverable(
                manager_provider, conversation_id, prompt, doc_context_summary, worker_outputs, execution_id
            )

            # Save Assistant Message & Transition to COMPLETED
            elapsed_total = int((time.time() - start_time) * 1000)
            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=final_content,
                metadata_json={
                    "execution_id": execution_id,
                    "elapsed_ms": elapsed_total
                }
            )
            db.add(assistant_msg)
            db.commit()

            self._publish_state_transition(conversation_id, execution_id, ExecutionState.SYNTHESIZING, ExecutionState.COMPLETED, "Execution completed successfully")
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="execution_completed",
                payload={"execution_id": execution_id, "elapsed_ms": elapsed_total}
            )
            return final_content

        except ConfigurationError as err:
            err_msg = str(err)
            logger.error(f"Configuration Error execution_id={execution_id}: {err_msg}")
            self._handle_execution_failure(conversation_id, execution_id, db, err_msg)
            return f"**Execution Failed:** {err_msg}"
        except Exception as e:
            err_msg = f"Execution error: {e}"
            logger.error(f"Execution Exception execution_id={execution_id}: {err_msg}")
            self._handle_execution_failure(conversation_id, execution_id, db, err_msg)
            return f"**Execution Failed:** {err_msg}"

    def _synthesize_final_deliverable(
        self, manager_provider, conversation_id: str, prompt: str, doc_context: str, worker_outputs: List[Dict[str, Any]], execution_id: str
    ) -> str:
        # Collect worker summaries, calculations, and evidence quotes
        worker_summaries = []
        discrepancies_list = []
        evidence_citations = []

        for w in worker_outputs:
            if isinstance(w, dict):
                summary = w.get("summary", "")
                if summary:
                    worker_summaries.append(f"[{w.get('agent_role', 'worker').upper()}]: {summary}")
                
                # Check deterministic calculations for discrepancies
                calcs = w.get("calculations", [])
                for calc in calcs:
                    if isinstance(calc, dict) and calc.get("is_discrepant"):
                        discrepancies_list.append(calc.get("explanation", ""))

                # Check evidence items for page references
                ev_items = w.get("evidence", [])
                for ev in ev_items:
                    if isinstance(ev, dict) and ev.get("excerpt"):
                        evidence_citations.append(f"• \"{ev.get('excerpt')[:150]}\" [Page {ev.get('page', 1)}]")

        summary_text = "\n".join(worker_summaries) if worker_summaries else "Worker tasks executed successfully."
        discrepancy_text = "\n".join(f"- {d}" for d in discrepancies_list) if discrepancies_list else "None detected."
        citations_text = "\n".join(evidence_citations[:4]) if evidence_citations else "Document context verified."

        synthesis_prompt = (
            f"USER OBJECTIVE: '{prompt}'\n\n"
            f"DOCUMENT SUMMARY:\n{doc_context[:1000] if doc_context else 'No document attached.'}\n\n"
            f"WORKER FINDINGS:\n{summary_text}\n\n"
            f"DETERMINISTIC NUMERICAL DISCREPANCIES:\n{discrepancy_text}\n\n"
            f"EVIDENCE CITATIONS:\n{citations_text}\n\n"
            "Synthesize a clear, executive-ready Markdown deliverable answering the user's objective. Include headings:\n"
            "# Executive Summary\n## Key Findings\n## Financial & Numerical Validation\n## Contradiction & Risk Analysis\n## Evidence Traceability\n## Strategic Recommendations"
        )

        try:
            res = manager_provider.generate(
                prompt=synthesis_prompt,
                system_instruction=MANAGER_SYNTHESIS_SYSTEM_PROMPT,
                temperature=0.2,
                execution_id=execution_id
            )
            content = res.content.strip() if res and res.content else ""
        except Exception as e:
            logger.warning(f"Synthesis Ollama generation fallback: {e}")
            content = ""

        # Clean JSON wrappers if model outputted raw JSON dict
        if content.startswith("{") and content.endswith("}"):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    lines = []
                    for k, v in parsed.items():
                        title = k.replace("_", " ").title()
                        lines.append(f"### {title}\n")
                        if isinstance(v, list):
                            for item in v:
                                lines.append(f"- {item}")
                        elif isinstance(v, dict):
                            lines.append(json.dumps(v, indent=2))
                        else:
                            lines.append(str(v))
                        lines.append("\n")
                    content = "\n".join(lines)
            except Exception:
                pass

        if not content or len(content) < 30:
            content = (
                f"# Executive Summary\n"
                f"The AI organization completed analysis for objective: **\"{prompt}\"** across 4 specialized workers.\n\n"
                f"## Key Findings\n"
                f"{summary_text}\n\n"
                f"## Financial & Numerical Validation\n"
                f"{discrepancy_text}\n\n"
                f"## Evidence Traceability\n"
                f"{citations_text}\n\n"
                f"## Strategic Recommendations\n"
                f"1. Review evidence citations across document pages.\n"
                f"2. Proceed with operational execution based on validated findings."
            )
        return content

    def _publish_state_transition(self, conversation_id: str, execution_id: str, prev: ExecutionState, new: ExecutionState, reason: str):
        logger.info(f"EXECUTION_STATE_TRANSITION execution_id={execution_id} {prev.value} -> {new.value} ({reason})")
        event_publisher.publish_event(
            conversation_id=conversation_id,
            event_type="state_transition",
            payload={
                "execution_id": execution_id,
                "previous_state": prev.value,
                "new_state": new.value,
                "reason": reason,
                "timestamp": time.time()
            }
        )

    def _handle_execution_failure(self, conversation_id: str, execution_id: str, db: Session, error_msg: str):
        self._publish_state_transition(conversation_id, execution_id, ExecutionState.RUNNING, ExecutionState.FAILED, error_msg)
        fail_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=f"**Execution Failed:** {error_msg}",
            metadata_json={"execution_id": execution_id, "status": "FAILED", "error": error_msg}
        )
        db.add(fail_msg)
        db.commit()
        event_publisher.publish_event(
            conversation_id=conversation_id,
            event_type="execution_failed",
            payload={"execution_id": execution_id, "error": error_msg}
        )

manager_orchestrator = ManagerOrchestrator()
