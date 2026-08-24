# SuprAI v2.0.0 — Autonomous Multi-Agent Reasoning & Evidence System

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/pov3sha/SuprAI)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20Verified-brightgreen.svg)]()
[![Engine](https://img.shields.io/badge/LLM-Local%20Ollama%20(qwen2.5)-orange.svg)]()
[![Calculation Engine](https://img.shields.io/badge/Arithmetic-Deterministic%20Python-blueviolet.svg)]()

**SuprAI v2.0.0** is an enterprise-grade, autonomous multi-agent AI organization platform that operates 100% offline using local LLM inference (via Ollama) combined with a **Deterministic Python Calculation Engine** and page-accurate evidence provenance.

---

## 🌟 Key Architectural Upgrades in v2.0.0

### 🧮 1. Deterministic Python Calculation Engine (`calculator.py`)
* **LLM Arithmetic Prohibition**: The LLM is never trusted for arithmetic truth. Raw numerical claims extracted from documents are passed to a deterministic Python engine.
* **Payback & Variance Formulas**: Automatically executes payback periods $\left(\frac{\text{Investment}}{\text{Annual Savings}} \times 12\right)$, percentage variances $\left(\frac{|B - A|}{A} \times 100\right)$, and flags discrepancies when stated metrics differ from math truth by $> 1\%$.

### 🔍 2. Complete Evidence Provenance Chain
* **Page Metadata Preservation**: Every evidence item maintains structured provenance fields (`evidence_id`, `task_id`, `worker_id`, `document_id`, `filename`, `chunk_id`, `page_number`, `source_excerpt`, `confidence`).
* **Page-Level Traceability**: All final report claims reference exact PDF page numbers (`[p. X]`).

### 🤖 3. Four Specialized Worker Roles
* **Consultant**: Evaluates strategic implications, trade-offs, operational consequences, and decision constraints.
* **Analyst**: Extracts raw numerical claims, triggers deterministic Python arithmetic calculations, and interprets discrepancies.
* **Researcher**: Discovers direct quotes, preserves page numbers, attaches structured evidence.
* **Intern**: Maps document structure, indexes sections, extracts entities and metric tables.

### 💬 4. Asynchronous Inter-Agent Communication & Non-Blocking Timeout
* **Dynamic Questions**: Workers emit real `agent_question` events when encountering document ambiguities.
* **Manager Guidance**: Lead Manager LLM returns real `manager_clarification` responses (`agent_acknowledged`).
* **Non-Blocking Fallback**: If Manager clarification times out or fails, worker transitions to `worker_continues_with_uncertainty` without blocking the pipeline.

### 🚫 5. Anti-Hardcoding Code Audit Passed 100%
* Automated code AST / regex scan verifies **0 test-document-specific hardcoded strings** in backend source code. All task objectives, numerical calculations, entity extractions, and synthesis outputs are derived dynamically.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18, TailwindCSS, Lucide Icons |
| **Backend Core** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2 |
| **Analytics Engine** | Pure Python Deterministic Calculator (`calculator.py`) |
| **Database** | PostgreSQL 16 (Relational metadata, tasks, evidence, & conversations) |
| **Event Bus & Cache** | Redis 7 (SSE Pub/Sub event distribution & idempotency locks) |
| **Object Storage** | MinIO S3 (PDF/DOCX/CSV document binary storage) |
| **AI Inference** | Ollama Engine (Local `qwen2.5` model runner) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quickstart & Installation

```bash
# 1. Clone repository
git clone https://github.com/pov3sha/SuprAI.git
cd SuprAI

# 2. Start services via Docker Compose
docker compose up --build -d

# 3. Access Command Center
# Open http://localhost:3001
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
