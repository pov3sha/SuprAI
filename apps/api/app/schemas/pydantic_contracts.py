from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- MANAGER CONTRACTS ---

class TaskSpec(BaseModel):
    task_id: str = Field(..., description="Unique slug or ID for this task within the plan (e.g. task_1)")
    objective: str = Field(..., description="Clear action statement for the worker")
    required_capabilities: List[str] = Field(default_factory=list, description="Capabilities required to execute this task")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Priority level")
    dependencies: List[str] = Field(default_factory=list, description="List of task_ids that must complete before this task")

class DecompositionResponse(BaseModel):
    objective: str = Field(..., description="Understanding of the overall objective")
    tasks: List[TaskSpec] = Field(..., description="Decomposed tasks graph")

# --- WORKER CONTRACTS ---

class EvidenceItem(BaseModel):
    document_id: Optional[str] = Field(None, description="ID of the document source if applicable")
    page: int = Field(..., description="Page number where the evidence appears (1-based index)")
    excerpt: str = Field(..., description="Exact verbatim quote/excerpt supporting the claim")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score of the evidence extraction")

class Finding(BaseModel):
    claim: str = Field(..., description="Factual claim or observation derived from analysis")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="List of evidence items supporting this claim")

class WorkerResponse(BaseModel):
    task_id: str = Field(..., description="ID of the task executed")
    status: Literal["completed", "failed"] = Field("completed", description="Outcome of execution")
    summary: str = Field(..., description="Executive summary of the worker's findings")
    findings: List[Finding] = Field(default_factory=list, description="List of structured findings with page-level evidence")

# --- API DTO SCHEMAS ---

class CreateProjectDTO(BaseModel):
    name: str
    description: Optional[str] = None

class CreateObjectiveDTO(BaseModel):
    conversation_id: Optional[str] = None
    prompt: str
    file_ids: List[str] = Field(default_factory=list)
