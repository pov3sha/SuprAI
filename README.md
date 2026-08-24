# SuprAI v1.0.0 — Autonomous AI Work Organization & Visual Command Center

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/pov3sha/SuprAI)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20Verified-brightgreen.svg)]()
[![Engine](https://img.shields.io/badge/LLM-Local%20Ollama%20(qwen2.5)-orange.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-HTTP%20202%20%2B%20Redis%20SSE-purple.svg)]()

**SuprAI** is an enterprise-grade, autonomous multi-agent AI organization platform that operates 100% offline using local LLM inference (via Ollama). It transforms complex document analysis and high-level user objectives into structured, multi-agent workflows executed by parallel AI workers—all monitored in real-time through an industrial matte-grayscale Visual Command Center.

---

## 🌟 Key Features & Architectural Highlights

### ⚡ 1. Asynchronous HTTP 202 + Redis SSE Pipeline
* **Non-Blocking Task Dispatch**: API requests return HTTP `202 Accepted` immediately with a tracking `execution_id`, freeing the frontend from timeout issues during long-running analytical workflows.
* **Real-time Event Streaming**: Server-Sent Events (SSE) powered by Redis pub/sub push execution state transitions, agent assignments, document extraction, evidence verification, and inter-agent communication directly to the browser.

### 🤖 2. Decoupled 4-Agent Parallel Organization Engine
* **Lead Manager**: Analyzes objectives, decomposes tasks, coordinates role-based assignment, provides strategic clarifications, and synthesizes final reports.
* **Consultant**: Performs high-level strategic reasoning, risk assessment, and operational recommendation analysis.
* **Analyst**: Processes quantitative metrics, structural data, and numerical document extractions.
* **Researcher**: Validates factual claims against multi-page document chunks and performs cross-reference verification.
* **Intern**: Extracts key entity relationships, structured metadata, and bullet points.

### 💬 3. Real Inter-Agent Communication Stream
* **Autonomous Clarifications**: When workers encounter ambiguous document context, they emit `agent_question` events back to the Lead Manager.
* **Manager Guidance**: The Lead Manager emits `manager_clarification` events, guiding workers on priority metrics before tasks finish (`agent_acknowledged`).

### 🔒 4. 100% Local Data Privacy & $0 API Cost
* **Zero External Cloud Calls**: Powered entirely by local Ollama engines (`qwen2.5:0.5b` or custom GGUF models). No OpenAI, Gemini, or Anthropic API keys required.
* **On-Premise Security**: Documents, PostgreSQL vector metadata, MinIO S3 object storage, and LLM inference remain entirely on local hardware.

### 🖥️ 5. Industrial Matte Grayscale Visual Command Center
* **Matte Palette**: Pure industrial grayscale aesthetic (`#121619` background, `#1C2226` cards, `#313A40` borders) paired with restrained, desaturated status indicators (`#7FAF91` matte green / `#A47A7A` matte red).
* **Interactive Full-Screen Modals**: Extend reports or inter-agent chat feeds into maximized overlay modals using the top-right `Maximize` tool.
* **Collapsible Sidebars**: Toggle both the left Project Navigation sidebar (`w-64` $\rightarrow$ `w-16`) and the right Execution Timeline sidebar (`w-80` $\rightarrow$ `w-14`).
* **Real-time Timeline Controls**: On-demand timeline clearing button and project workspace isolation.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18, TailwindCSS, Lucide Icons |
| **Backend Core** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2 |
| **Database** | PostgreSQL 16 (Relational metadata, tasks, evidence, & conversations) |
| **Event Bus & Cache** | Redis 7 (SSE Pub/Sub event distribution & idempotency locks) |
| **Object Storage** | MinIO S3 (PDF/DOCX/CSV document binary storage) |
| **AI Inference** | Ollama Engine (Local `qwen2.5` model runner) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quickstart & Installation

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running.
* [Ollama](https://ollama.com/) installed locally with `qwen2.5:0.5b` pulled (`ollama pull qwen2.5:0.5b`).

### 1. Clone the Repository
```bash
git clone https://github.com/pov3sha/SuprAI.git
cd SuprAI
```

### 2. Start Services via Docker Compose
```bash
docker compose up --build -d
```

### 3. Access the Visual Command Center
Open your browser and navigate to:
👉 **[http://localhost:3001](http://localhost:3001)** (or `http://localhost:3000`)

* Backend OpenAPI documentation is available at **[http://localhost:8001/docs](http://localhost:8001/docs)**.

---

## 📊 Workflow Lifecycle

```text
USER OBJECTIVE / DOCUMENT ATTACHED
               │
               ▼
   [ 1. HTTP 202 ACCEPTED ] ──► SSE Event Stream Initialized
               │
               ▼
      [ 2. LEAD MANAGER ]
    Task Graph Decomposition
               │
   ┌───────────┼───────────┬───────────┐
   ▼           ▼           ▼           ▼
[CONSULTANT] [ANALYST] [RESEARCHER] [INTERN]
   │           │           │           │
   └───────────┴─────┬─────┴───────────┘
                     │
                     ▼
       [ 3. INTER-AGENT CHAT ]
   Worker Question ↔ Manager Guidance
                     │
                     ▼
      [ 4. EVIDENCE VERIFICATION ]
   Page-accurate quote extraction
                     │
                     ▼
       [ 5. FINAL SYNTHESIS ]
   Structured Executive Report Delivered
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Author & Acknowledgments

Developed by **Esha Srivastava** — [GitHub Repository](https://github.com/pov3sha/SuprAI)
