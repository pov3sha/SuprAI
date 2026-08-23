import pytest
from app.schemas.pydantic_contracts import DecompositionResponse, TaskSpec, WorkerResponse, Finding, EvidenceItem
from app.services.evidence.validator import validate_evidence_against_document

def test_manager_pydantic_contract():
    raw_data = {
        "objective": "Analyze quarterly business risks",
        "tasks": [
            {
                "task_id": "task_1",
                "objective": "Financial risk analysis",
                "required_capabilities": ["financial_analysis", "reasoning"],
                "priority": "high",
                "dependencies": []
            }
        ]
    }
    parsed = DecompositionResponse.model_validate(raw_data)
    assert parsed.objective == "Analyze quarterly business risks"
    assert len(parsed.tasks) == 1
    assert parsed.tasks[0].task_id == "task_1"
    assert "financial_analysis" in parsed.tasks[0].required_capabilities

def test_worker_pydantic_contract():
    raw_data = {
        "task_id": "task_1",
        "status": "completed",
        "summary": "Financial risk findings",
        "findings": [
            {
                "claim": "Revenue concentration risk increased",
                "evidence": [
                    {
                        "document_id": "doc_123",
                        "page": 12,
                        "excerpt": "Customer A represented 41% of revenue in FY2025.",
                        "confidence": 0.95
                    }
                ]
            }
        ]
    }
    parsed = WorkerResponse.model_validate(raw_data)
    assert parsed.status == "completed"
    assert len(parsed.findings) == 1
    assert parsed.findings[0].evidence[0].page == 12
    assert "Customer A" in parsed.findings[0].evidence[0].excerpt
