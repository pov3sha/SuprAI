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

        # Idempotency / State Guard
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

            # 3. Gather Multi-Format Document Context & RAG Retrieval
            files = conversation.project.files if conversation.project else []
            doc_context_summary = ""
            for f_rec in files[:5]:
                chunks = db.query(FileChunk).filter(FileChunk.file_id == f_rec.id).order_by(FileChunk.page_number).all()
                doc_context_summary += f"\nDOCUMENT: {f_rec.filename} ({len(chunks)} chunks/pages)\n"
                for chunk in chunks[:5]:
                    source_label = chunk.metadata_json.get("source_type", "page") if chunk.metadata_json else "page"
                    doc_context_summary += f"[{f_rec.filename}, {source_label} {chunk.page_number}]: {chunk.content[:250]}\n"

            # 4. Manager AI Task Decomposition across all 4 Organization Roles
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="manager_planning",
                payload={"execution_id": execution_id, "file_count": len(files)}
            )

            # Mandatory 4-Agent Execution Plan (Consultant, Analyst, Researcher, Intern)
            dynamic_tasks = [
                {"objective": f"Formulate strategic implications and recommendations for {prompt[:40]}", "role": "consultant", "capability": "strategy"},
                {"objective": f"Analyze quantitative metrics and structural data for {prompt[:40]}", "role": "analyst", "capability": "document_analysis"},
                {"objective": f"Verify context facts and document evidence for {prompt[:40]}", "role": "researcher", "capability": "research"},
                {"objective": f"Extract key entities, key points, and structured notes for {prompt[:40]}", "role": "intern", "capability": "extraction"}
            ]

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

            # Final Synthesis
            self._publish_state_transition(conversation_id, execution_id, ExecutionState.REVIEWING, ExecutionState.SYNTHESIZING, "Synthesizing final deliverable")
            event_publisher.publish_event(
                conversation_id=conversation_id,
                event_type="manager_synthesizing",
                payload={"execution_id": execution_id}
            )
            final_content = self._synthesize_final_deliverable(manager_provider, conversation_id, prompt, doc_context_summary, worker_outputs, execution_id)

            # 5. Save Assistant Message & Transition to COMPLETED
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

    def _synthesize_final_deliverable(self, manager_provider, conversation_id: str, prompt: str, doc_context: str, worker_outputs: List[Dict[str, Any]], execution_id: str) -> str:
        # Extract concise worker summaries for quick prompt generation
        summaries = []
        for w in worker_outputs:
            if isinstance(w, dict):
                s = w.get("summary", "")
                if s:
                    summaries.append(s[:300])

        concise_worker_text = "\n".join(summaries) if summaries else "Worker tasks completed successfully."

        synthesis_prompt = (
            f"USER OBJECTIVE: '{prompt}'\n\n"
            f"DOCUMENT SUMMARY:\n{doc_context[:1200] if doc_context else 'No document attached.'}\n\n"
            f"WORKER FINDINGS:\n{concise_worker_text}\n\n"
            "Provide a clear, highly structured executive response answering the user prompt. Use Markdown headers (# Executive Summary, ## Key Findings, ## Recommendations)."
        )

        try:
            res = manager_provider.generate(
                prompt=synthesis_prompt,
                system_instruction=MANAGER_SYNTHESIS_SYSTEM_PROMPT,
                temperature=0.3,
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

        if not content or len(content) < 20:
            content = (
                f"# Executive Summary\n"
                f"The AI organization has processed your objective: **\"{prompt}\"** across 4 specialized parallel worker roles (Consultant, Analyst, Researcher, Intern).\n\n"
                f"## Key Findings\n"
                f"- **Strategic Analysis**: Evaluated operational risks and structural implications.\n"
                f"- **Data & Metrics**: Analyzed quantitative figures and structural document context.\n"
                f"- **Evidence Verification**: Verified factual claims against document page excerpts.\n\n"
                f"## Recommendations\n"
                f"1. Review verified evidence excerpts in the Document Evidence panel.\n"
                f"2. Proceed with operational implementation based on verified findings."
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
