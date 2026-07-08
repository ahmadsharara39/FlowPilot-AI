<div align="center">

# ⚡ FlowPilot AI

**An AI-powered automation & integration platform — build workflows that connect triggers, AI processing, and actions.**

Think Zapier / Make / n8n, but simpler and AI-native.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API](#-api-reference) · [Roadmap](#-future-improvements)

</div>

---

## 📖 Overview

FlowPilot AI lets you compose **workflows** from ordered **steps**. A workflow is kicked off by a
**trigger** (manual run or an inbound webhook), then each step transforms the payload and passes its
output to the next step. Every run is fully recorded — status, timing, and per-step input/output
snapshots — so you can inspect exactly what happened.

Example workflow — **Customer Feedback Triage**:

> When customer feedback arrives → **summarize** it → **classify** its urgency → send a Slack-style
> **notification** → **save** the result.

The platform ships with a deterministic **mock AI provider**, so the entire product is fully demoable
**without any paid API keys**. Drop in an OpenAI or Anthropic key to switch to real models.

## ✨ Features

- 🔐 **JWT authentication** — register, login, protected dashboard, per-user resource isolation
- 🧩 **Workflow builder** — create workflows, add/configure/reorder steps, choose triggers
- 🤖 **AI steps** — `ai_summarize`, `ai_classify`, `ai_extract_json` via a pluggable provider abstraction
- 🔗 **Action steps** — `http_request`, `slack_webhook_mock`, `save_result`
- ⚙️ **Execution engine** — ordered step dispatch, output chaining, full audit trail, fail-fast semantics
- 🪝 **Webhook triggers** — unguessable token URLs to run workflows from anything that can POST
- 📜 **Execution history** — list + detailed per-step timeline with input/output/error snapshots
- 📊 **Dashboard** — workflow/run counts, success rate, run-breakdown chart, recent activity
- 🔌 **Connectors page** — active + clearly-labeled "coming soon" integrations
- 🧪 **Mock AI fallback** — works offline; the UI clearly flags when mock AI is in use
- 🧵 **Background jobs** — optional Celery + Redis execution mode (inline by default for zero-setup demos)

## 🛠 Tech Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Recharts, Axios |
| **Backend**  | FastAPI, Python 3.11, SQLAlchemy 2, Alembic, Pydantic v2, JWT (python-jose), Passlib/bcrypt |
| **Data**     | PostgreSQL (or SQLite for zero-setup dev), Redis |
| **Jobs**     | Celery (optional; inline execution by default) |
| **AI**       | OpenAI, Anthropic, or built-in deterministic Mock provider |
| **DevOps**   | Docker Compose (Postgres + Redis), `.env` config |

## 📸 Screenshots

> _Placeholder — add screenshots/GIFs here._

| Dashboard | Workflow Builder | Execution Detail |
|-----------|------------------|------------------|
| `docs/dashboard.png` | `docs/workflow-builder.png` | `docs/execution-detail.png` |

## 🏗 Architecture

```
flowpilot-ai/
├── docker-compose.yml         # Postgres + Redis
├── .env.example               # copy to .env
├── scripts/seed_demo.py       # demo user + "Customer Feedback Triage" workflow
├── apps/
│   ├── api/                   # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── core/          # config, database, security
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   ├── schemas/       # Pydantic request/response models
│   │   │   ├── api/           # deps + routers (auth, workflows, executions, webhooks, ...)
│   │   │   ├── services/
│   │   │   │   ├── ai/         # AIProvider abstraction: mock / openai / anthropic + factory
│   │   │   │   ├── engine/     # step handler registry + execution runner
│   │   │   │   ├── connectors/ # connector catalog
│   │   │   │   └── dispatch.py # inline vs. celery dispatch
│   │   │   └── workers/       # Celery app + tasks
│   │   ├── migrations/        # Alembic
│   │   └── tests/             # pytest
│   └── web/                   # React + Vite frontend
│       └── src/
│           ├── api/           # axios client + typed endpoints
│           ├── components/    # UI primitives
│           ├── hooks/         # useAuth
│           ├── layouts/       # dashboard shell
│           ├── pages/         # routes
│           └── utils/
```

**Execution flow:** `POST /run` (or webhook) → `dispatch_execution` → create `WorkflowExecution`
→ engine loads ordered `WorkflowStep`s → for each step, look up its handler in the registry, run it,
write a `WorkflowStepLog`, and feed the output to the next step → on failure, mark the step + execution
`failed`, store the error, and stop.

**Extensibility:** adding a step type is a single decorated function — no engine changes:

```python
@register("my_step")
def my_step(config: dict, data: Any) -> Any:
    ...  # validate config, return output for the next step
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) Docker Desktop — only needed for PostgreSQL/Redis

### 1. Clone & configure

```bash
git clone <your-repo-url> flowpilot-ai
cd flowpilot-ai
cp .env.example .env      # defaults work out of the box (SQLite + Mock AI)
```

### 2. (Optional) Start Postgres + Redis

The app defaults to **SQLite** and **inline** execution, so this step is optional.

```bash
docker compose up -d
# then in .env set:
#   DATABASE_URL=postgresql+psycopg://flowpilot:flowpilot@localhost:5432/flowpilot
#   REDIS_URL=redis://localhost:6379/0
```

### 3. Run the backend

```bash
cd apps/api
python -m venv .venv
# Windows:  .venv\Scripts\activate      |  macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt

# (Optional, for Postgres) apply migrations:
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

> On SQLite the app auto-creates tables at startup, so you can skip Alembic for local dev.

### 4. Seed demo data

From the repo root (with the API venv active):

```bash
cd apps/api
python ../../scripts/seed_demo.py
```

This creates:
- **Demo login** — `demo@flowpilot.ai` / `demo1234`
- The **Customer Feedback Triage** workflow (webhook-triggered) and prints its webhook URL.

### 5. Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173, sign in with the demo credentials (or click **Use demo credentials**),
and hit **Run Demo Workflow** on the dashboard.

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me...` | JWT signing secret (**set a strong value in prod**) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime |
| `DATABASE_URL` | `sqlite:///./flowpilot.db` | SQLAlchemy DB URL (Postgres supported) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker/result backend |
| `EXECUTION_MODE` | `inline` | `inline` (sync) or `celery` (background worker) |
| `AI_PROVIDER` | `mock` | `openai`, `anthropic`, or `mock` |
| `AI_MODEL` | _(empty)_ | Override model id (else provider default) |
| `OPENAI_API_KEY` | _(empty)_ | Enables the OpenAI provider |
| `ANTHROPIC_API_KEY` | _(empty)_ | Enables the Anthropic provider |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

> If `AI_PROVIDER` is set but no matching key is present, FlowPilot automatically falls back to the
> **mock provider** and flags it in the UI / `GET /api/health`.

## 🧵 Background jobs (optional)

By default executions run **inline** so no worker is required. To run them in the background:

```bash
# .env
EXECUTION_MODE=celery

# terminal (from apps/api, venv active)
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

Webhook and manual runs will then create a `pending` execution and hand it to the worker.

## 🧪 Tests

```bash
cd apps/api
pytest
```

Covers auth, workflow CRUD, the execution engine (including failure handling), and webhook triggers.

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account, returns JWT |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET`  | `/api/auth/me` | Current user |
| `GET`  | `/api/dashboard/stats` | Aggregate counts for the dashboard |
| `GET`  | `/api/workflows` | List workflows |
| `POST` | `/api/workflows` | Create workflow (with optional steps) |
| `GET`  | `/api/workflows/{id}` | Get workflow + steps |
| `PUT`  | `/api/workflows/{id}` | Update workflow |
| `DELETE` | `/api/workflows/{id}` | Delete workflow |
| `POST` | `/api/workflows/{id}/steps` | Add step |
| `PUT`  | `/api/workflows/{id}/steps/{step_id}` | Update step |
| `DELETE` | `/api/workflows/{id}/steps/{step_id}` | Delete step |
| `POST` | `/api/workflows/{id}/run` | Run workflow manually |
| `GET`  | `/api/executions` | List executions |
| `GET`  | `/api/executions/{id}` | Execution detail + step logs |
| `POST` | `/api/webhooks/{token}` | Trigger a webhook workflow (no auth) |
| `GET`  | `/api/connectors` | Connector catalog |
| `GET`  | `/api/health` | Health + runtime info |

### Example: trigger a workflow via webhook

```bash
curl -X POST http://localhost:8000/api/webhooks/<WEBHOOK_TOKEN> \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "Sarah",
    "message": "I was charged twice this month and I need this fixed today. I already emailed support twice."
  }'
```

Response:

```json
{ "execution_id": 12, "status": "success", "workflow_id": 1 }
```

Then open `http://localhost:5173/executions/12` to see the summarized text, the `billing_issue`
classification, the generated Slack notification, and the saved result — with per-step logs.

## 🧭 Demo Workflow — Customer Feedback Triage

| # | Step | Type | What it does |
|---|------|------|--------------|
| 1 | Summarize feedback | `ai_summarize` | Condenses the message |
| 2 | Classify urgency | `ai_classify` | `urgent_bug` / `feature_request` / `billing_issue` / `general_feedback` |
| 3 | Notify support channel | `slack_webhook_mock` | Builds a Slack-style notification |
| 4 | Save triage result | `save_result` | Persists the final output |

## 🔭 Future Improvements

- Visual drag-and-drop workflow canvas
- Scheduled (cron) triggers and retries with backoff
- Real connectors: Gmail, Google Sheets, Website Monitor
- Conditional branching & fan-out steps
- Per-step secrets vault & OAuth connections
- Streaming AI output and token/cost tracking
- Role-based access & team workspaces

## 💡 Why This Project

FlowPilot AI is a compact but realistic slice of a production SaaS: typed end-to-end APIs, a clean
service-layer architecture, a pluggable provider pattern, an extensible execution engine with a full
audit trail, background-job readiness, and a polished, state-aware React UI. It demonstrates
full-stack, AI-integration, and systems-design skills in one coherent, runnable product.

---

<div align="center"><sub>Built as a portfolio project. © 2026 FlowPilot AI.</sub></div>
