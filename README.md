# 🎓 CampusPilot AI
### *Your Campus. Your AI. Your Problems Solved.*

CampusPilot AI is a production-quality, agentic AI-powered college student support and campus operations platform. It eliminates counter queues and administrative runarounds by allowing students to report issues in natural language, automatically perceiving user intent, choosing specialized domain agents, formulating actionable resolution plans, routing tickets to college desks, and keeping human staff in the loop for official authorizations.

---

## 🌟 Key Architecture & Capabilities

CampusPilot AI implements a **true 7-stage Agentic AI Workflow**:

1. **Perception**: Interprets unstructured natural-language student requests.
2. **Reasoning**: Evaluates issue taxonomy, identifies risk/urgency, and determines next steps.
3. **Planning**: Formulates a structured 4-step action plan and identifies missing evidence.
4. **Tool Usage**: Calls validated backend tools to create immutable support tickets (`CP-2026-XXXX`).
5. **Execution**: Routes tickets to responsible campus departments.
6. **Observation**: Tracks live ticket status (`Pending` ➔ `In Progress` ➔ `Resolved`).
7. **Human Collaboration**: Requires certified college staff review and sign-off before modifying official institutional records.

---

## 🤖 Multi-Agent Architecture

The system coordinates **One Central AI Orchestrator** and **Four Domain Specialist Agents**:

| Agent | Responsible Department | Core Mandate |
| :--- | :--- | :--- |
| **Attendance Agent** | Attendance & Academic Records Department | Audits biometric/QR mismatches, lecture hour logs, condonation petitions, and medical leaves without unauthorized record modification. |
| **Finance Agent** | Accounts & Finance Department | Traces bank gateway UTR reference codes, reconciles treasury deposits, verifies scholarship adjustments, and issues digitally sealed receipts. |
| **Document Agent** | Student Affairs & Registrar Office | Verifies enrollment eligibility, generates mandatory attachment checklists, and processes Bonafide certificates and ID card replacements. |
| **Academic Agent** | Office of Controller of Examinations & Academic Dean | Resolves dual-exam timetable clashes, verifies classroom allocations, coordinates lab access passes, and handles internal mark petitions. |

---

## ⚡ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts data visualization.
- **Backend**: Python 3.13, FastAPI, Pydantic v2 validation, Python-Dotenv, Uvicorn.
- **Database**: SQLite (persisted in `backend/campus_pilot.db`) with full transactional integrity, foreign keys, and indexes.
- **AI Engine**: 
  - **Live Mode**: Google Gemini 2.0 Flash (configured securely via backend `GEMINI_API_KEY`).
  - **Fallback Engine**: High-precision deterministic rule-based agent engine with honest AI status badges (never simulates fake live LLM output).
- **Deployment**: Single-port production mode (FastAPI mounts the optimized React SPA at `/`) and decoupled Vercel + Cloud Run support.

---

## 🚀 Quick Start Guide

### 1. Clone & Enter Project Directory
```powershell
cd "c:\Users\Kusuma N\OneDrive\Documents\Desktop\Compus Pilot Ai"
```

### 2. Environment Variables (Optional)
If you wish to enable the live Google Gemini API, configure `.env` (a `.env.example` is provided):
```ini
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
HOST=127.0.0.1
```
*Note: If no API key is provided, the deterministic rule-based agent engine automatically engages with 100% functionality.*

### 3. Run the Application
Launch the unified full-stack application with a single command:
```powershell
python run.py
```

Open your browser to:
- **Web Application**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 Automated Test Verification

All 6 hackathon evaluation scenarios have been built and verified via `test_workflows.py`:

```powershell
python test_workflows.py
```

### Verified Test Results:
- ✅ **Scenario 1**: Student reports attendance discrepancy ➔ Campus Orchestrator selects **Attendance Agent** ➔ Formulates 4-step action plan ➔ Creates ticket `CP-2026-0009` after student confirmation ➔ Prevents duplicate submissions.
- ✅ **Scenario 2**: Student reports missing fee receipt ➔ System selects **Finance Agent** and routes to Accounts Desk.
- ✅ **Scenario 3**: Student requests bonafide certificate ➔ System selects **Document Agent** and outputs mandatory attachment checklist.
- ✅ **Scenario 4**: Admin opens ticket and changes status from `Pending` to `In Progress` with official staff note.
- ✅ **Scenario 5**: Student refreshes dashboard and verifies persisted status `In Progress` and audit trail in SQLite database.
- ✅ **Scenario 6**: Gemini API unavailable ➔ Fallback classification and ticket creation continue working with honest fallback disclaimer.

---

## 🎭 Live Hackathon Demonstration Flow

1. **Landing Page**:
   - Showcase the modern dark SaaS design system and headline: *"Your Campus. Your AI. Your Problems Solved."*
   - Point out the real-time AI Engine Status Pill (`Fallback Engine` or `Gemini Live`).
   - Click one of the interactive problem pills (e.g. *"My attendance is showing 16%, but I attended most classes"*).
2. **Student Dashboard & AI Assistant**:
   - Notice how the query is automatically passed to the Assistant.
   - Observe the **Agent Selection Badge** (Attendance Agent) and **Orchestrator Reasoning Box** explaining *why* it was selected.
   - Review the **Generated Action Plan** and **Required Evidence Checklist**.
   - Click **Confirm & Submit Ticket** ➔ Generates ticket `CP-2026-XXXX`.
3. **Agentic Workflow Tracker**:
   - Click **Workflow Tracker** in the sidebar to view the live 9-stage pipeline:
     `Student Request` ➔ `Intent Recognition` ➔ `AI Orchestrator` ➔ `Specialist Agent Selection` ➔ `Action Planning` ➔ `Department Routing` ➔ `Ticket Creation` ➔ `Human Review` ➔ `Resolution Tracking`.
   - Click any stage node to inspect the live data payload.
4. **Staff / Admin Control Center**:
   - Click the top navigation switcher to enter **Staff / Admin** mode.
   - Review department load and category distributions via Recharts.
   - Select ticket `CP-2026-XXXX` and click **Manage**.
   - Add a staff note, reassign department if necessary, and click **Approve & Mark Resolved**.
5. **Real-time Persistence & Notification**:
   - Switch back to **Student** view.
   - Notice the updated status badge (`Resolved`), the newly logged in-app notification in the top bell drawer, and the audit trail.
   - Click **Reset Demo** anytime to restore the showcase data.

---

## ⚡ Supabase Cloud PostgreSQL Migrations

The complete PostgreSQL schema, Row Level Security (RLS) policies, and seed data are maintained in:
`supabase/migrations/001_initial_schema.sql`

### Applying Migrations to Supabase Cloud

#### Option A: Direct via CLI / Node.js Runner
Set your `DATABASE_URL` or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env` and run:
```bash
npm run db:migrate
```
*(or `node supabase/apply-migrations.js` / `python supabase/apply_migrations.py`)*

#### Option B: Supabase Web Dashboard (1-Click SQL Editor)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **SQL Editor** in the left sidebar ➔ **New Query**.
3. Copy and paste the entire contents of [001_initial_schema.sql](file:///c:/Users/Kusuma%20N/OneDrive/Documents/Desktop/Compus%20Pilot%20Ai/supabase/migrations/001_initial_schema.sql).
4. Click **Run**. All tables (`students`, `tickets`, `notifications`, `staff_notes`, `workflow_logs`), RLS policies, and sample demonstration data will be created instantly.

---

## 🌐 Cloud Deployment Instructions

### Deploying Frontend to Vercel
1. Set the root directory in Vercel to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend-domain.com`

### Deploying Backend
The FastAPI backend can be deployed with Docker or directly on Render / Railway / Google Cloud Run:
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r backend/requirements.txt
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
#   C a m p u s P l i o t A I  
 