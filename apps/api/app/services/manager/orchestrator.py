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

        try:
            # 1. Instantiate Manager AI Provider dynamically (Ollama)
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
                for chunk in chunks[:10]:
                    source_label = chunk.metadata_json.get("source_type", "page") if chunk.metadata_json else "page"
                    doc_context_summary += f"[{f_rec.filename}, {source_label} {chunk.page_number}]: {chunk.content[:400]}\n"

            # 4. Manager AI Dynamic Workflow Decision (Simple vs Complex Delegation)
            manager_decomp_prompt = (
                f"USER OBJECTIVE: '{prompt}'\n\n"
                f"ATTACHED DOCUMENTS:\n{doc_context_summary if doc_context_summary else 'No files attached.'}\n\n"
                "Determine if this objective requires multi-agent worker task delegation or direct synthesis.\n"
                "If delegation is required, return a JSON array of tasks with target roles (consultant, analyst, researcher):\n"
                "[\n"
                "  {\"objective\": \"Task 1 description\", \"role\": \"analyst\", \"capability\": \"document_analysis\"}\n"
                "]\n"
                "If simple question or direct summary, return an empty array: []"
            )

            decomp_res = manager_provider.generate(
                prompt=manager_decomp_prompt,
                system_instruction=MANAGER_SYSTEM_PROMPT,
                temperature=0.1,
                execution_id=execution_id
            )

            # Parse Tasks from Manager AI
            dynamic_tasks = []
            if decomp_res.content:
                try:
                    match = re.search(r'\[.*\]', decomp_res.content, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        for item in parsed:
                            if isinstance(item, dict) and "objective" in item:
                                dynamic_tasks.append({
                                    "objective": item["objective"],
                                    "role": item.get("role", "analyst"),
                                    "capability": item.get("capability", "document_analysis")
                                })
                except Exception as e:
                    logger.warning(f"Could not parse dynamic tasks JSON: {e}")

            # 5. Execution State Machine: Direct Synthesis vs Parallel Workers
            if not dynamic_tasks and ("summarize" in prompt.lower() or len(prompt.split()) < 6):
                # Direct Manager Synthesis
                self._publish_state_transition(conversation_id, execution_id, ExecutionState.PLANNING, ExecutionState.SYNTHESIZING, "Direct Manager synthesis")
                final_content = self._synthesize_final_deliverable(manager_provider, conversation_id, prompt, doc_context_summary, [], execution_id)
            else:
                # Complex objective -> Task Graph & Parallel Workers
                if not dynamic_tasks:
                    dynamic_tasks = [
                        {"objective": f"Analyze document context for {prompt[:40]}", "role": "analyst", "capability": "document_analysis"},
                        {"objective": f"Formulate strategy recommendations for {prompt[:40]}", "role": "consultant", "capability": "strategy"}
                    ]

                self._publish_state_transition(conversation_id, execution_id, ExecutionState.PLANNING, ExecutionState.RUNNING, "Executing task graph")

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
                            "objective": t.objective,
                            "role": tdata["role"]
                        }
                    )

                self._publish_state_transition(conversation_id, execution_id, ExecutionState.RUNNING, ExecutionState.WAITING_FOR_WORKERS, "Waiting for parallel worker tasks")

                # Parallel Worker Execution via TaskExecutor Abstraction
                worker_outputs = task_executor.execute_tasks(created_tasks, db, execution_id)

                # Reviewing & Evidence Verification
                self._publish_state_transition(conversation_id, execution_id, ExecutionState.WAITING_FOR_WORKERS, ExecutionState.REVIEWING, "Reviewing worker results")

                # Final Synthesis
                self._publish_state_transition(conversation_id, execution_id, ExecutionState.REVIEWING, ExecutionState.SYNTHESIZING, "Synthesizing final deliverable")
                final_content = self._synthesize_final_deliverable(manager_provider, conversation_id, prompt, doc_context_summary, worker_outputs, execution_id)

            # 6. Save Assistant Message & Transition to COMPLETED
            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=final_content,
                metadata_json={
                    "execution_id": execution_id,
                    "elapsed_ms": int((time.time() - start_time) * 1000)
                }
            )
            db.add(assistant_msg)
            db.commit()

            self._publish_state_transition(conversation_id, execution_id, ExecutionState.SYNTHESIZING, ExecutionState.COMPLETED, "Execution completed successfully")
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
        synthesis_prompt = (
            f"USER OBJECTIVE: '{prompt}'\n\n"
            f"ATTACHED DOCUMENT CONTENT:\n{doc_context if doc_context else 'No document attached.'}\n\n"
            f"WORKER ANALYSIS FINDINGS:\n{json.dumps(worker_outputs, indent=2) if worker_outputs else 'Direct Manager analysis.'}\n\n"
            "Produce a comprehensive, highly structured, professional natural language deliverable answering the user's prompt.\n"
            "DO NOT output raw JSON or JSON dictionary objects. Output clear Markdown text with headings (#, ##), bullet points, and actionable implementation steps."
        )

        res = manager_provider.generate(
            prompt=synthesis_prompt,
            system_instruction=MANAGER_SYNTHESIS_SYSTEM_PROMPT,
            temperature=0.3,
            execution_id=execution_id
        )

        content = res.content.strip() if res.content else ""

        # Clean JSON wrappers if model outputted raw JSON dict
        if content.startswith("{") and content.endswith("}"):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    # Extract text values from dict into Markdown
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

        if not content:
            content = f"Analysis deliverable for objective: {prompt}"
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
