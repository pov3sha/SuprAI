import json
from app.db.base import SessionLocal
from app.models.schema import Project, Conversation, FileRecord
from app.services.files.processor import process_uploaded_document
from app.services.files.storage import storage_service
from app.services.manager.orchestrator import manager_orchestrator

db = SessionLocal()

# 1. Create a clean project
proj = Project(name="Production Security & Ops Project", description="Testing Real Document Analysis")
db.add(proj)
db.commit()
db.refresh(proj)

conv = Conversation(project_id=proj.id, title="Ops Analysis Chat")
db.add(conv)
db.commit()
db.refresh(conv)

# 2. Attach a realistic operational risk document
doc_text = """
CONFIDENTIAL OPERATIONAL RISK REPORT 2026

Section 1: Critical System Vulnerabilities
1. Database Failover Delay: The automated database failover mechanism experiences a 14-minute lag during primary node failures, risking transaction loss.
2. Unencrypted Transmission: Internal API communications between microservices lack TLS 1.3 encryption, creating a high interception vulnerability.
3. Access Key Exposure: Legacy service accounts possess hardcoded static access keys in deployment scripts without 90-day rotation compliance.

Section 2: Action Items & Recommendations
- Upgrade database cluster failover to multi-region synchronous replication to reduce failover lag to under 5 seconds.
- Enforce mandatory mTLS encryption across all microservice ingress and egress points.
- Implement AWS IAM Roles and Vault secrets management to eliminate static API keys.
"""

content_bytes = doc_text.strip().encode("utf-8")
storage_path = f"{proj.id}/risk_report.txt"
storage_service.upload_file(content_bytes, storage_path, "text/plain")

rec = FileRecord(
    project_id=proj.id,
    filename="risk_report.txt",
    mime_type="text/plain",
    size_bytes=len(content_bytes),
    storage_path=storage_path,
    status="UPLOADED"
)
db.add(rec)
db.commit()
db.refresh(rec)

# Process document (Extract & Chunk)
processed_file = process_uploaded_document(rec.id, db)
print(f"DOCUMENT PROCESSED: {processed_file.filename} (Chunks: {len(processed_file.chunks)})")

# 3. Submit real objective prompt
user_prompt = "Review this document, identify the three most important problems, explain the evidence for each, and recommend what I should do next."

print(f"\n--- SUBMITTING OBJECTIVE TO REAL OLLAMA ENGINE ---")
print(f"Objective: '{user_prompt}'\n")

final_answer = manager_orchestrator.process_objective(conv.id, user_prompt, db)

print("\n=======================================================")
print("FINAL DELIVERABLE PRODUCED BY SUPRAI OLLAMA ENGINE:")
print("=======================================================\n")
print(final_answer)
