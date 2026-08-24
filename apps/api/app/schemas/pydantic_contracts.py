from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CreateProjectDTO(BaseModel):
    name: str
    description: Optional[str] = None

class EvidenceItem(BaseModel):
    evidence_id: Optional[str] = None
    task_id: Optional[str] = None
    worker_id: Optional[str] = None
    document_id: Optional[str] = None
    filename: Optional[str] = None
    chunk_id: Optional[str] = None
    page: int = 1
    section: Optional[str] = None
    excerpt: str
    confidence: float = 0.95
    evidence_type: str = "direct_quote"  # "direct_quote" | "inference"

class NumericalClaim(BaseModel):
    metric_name: str
    value_raw: str
    value_float: Optional[float] = None
    unit: Optional[str] = None
    page: int = 1
    section: Optional[str] = None

class DeterministicCalculation(BaseModel):
    metric_name: str
    formula: str
    input_values: Dict[str, float] = Field(default_factory=dict)
    calculated_result: float
    stated_result: Optional[float] = None
    discrepancy_amount: float = 0.0
    is_discrepant: bool = False
    explanation: str = ""

class Contradiction(BaseModel):
    claim_a: str
    page_a: int = 1
    claim_b: str
    page_b: int = 1
    conflict_description: str
    severity: str = "moderate"  # "critical" | "moderate"

class Finding(BaseModel):
    claim: str
    analysis: Optional[str] = None
    evidence: List[EvidenceItem] = Field(default_factory=list)

class AgentQuestion(BaseModel):
    agent_name: str
    target: str = "Manager"
    question: str
    ambiguity_type: Optional[str] = None

class ManagerClarification(BaseModel):
    sender: str = "Manager"
    target: str
    response: str
    strategic_direction: Optional[str] = None

class WorkerResponse(BaseModel):
    agent_role: str
    task_id: str
    status: str = "completed"
    summary: str
    uncertainties: List[str] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    numerical_claims: List[NumericalClaim] = Field(default_factory=list)
    calculations: List[DeterministicCalculation] = Field(default_factory=list)
    contradictions: List[Contradiction] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)

class TaskDecompositionItem(BaseModel):
    role: str
    capability: str
    objective: str

class TaskDecompositionPlan(BaseModel):
    reasoning: str
    tasks: List[TaskDecompositionItem]
