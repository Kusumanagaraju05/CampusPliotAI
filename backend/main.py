import os
import json
import sqlite3
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .database import get_db_connection, init_db
from .schemas import (
    StudentBase,
    ProcessQueryRequest,
    OrchestratorResult,
    TicketCreateRequest,
    TicketResponse,
    TicketStatusUpdateRequest,
    TicketDepartmentUpdateRequest,
    StaffNoteCreateRequest,
    StaffNoteResponse,
    NotificationResponse,
    AnalyticsResponse
)
from .agents.orchestrator import process_student_query
from .agents.tools import (
    create_ticket,
    update_ticket_status,
    assign_department,
    retrieve_ticket,
    list_student_tickets
)
from .seed_data import seed_database

app = FastAPI(
    title="CampusPilot AI API",
    description="Agentic AI-Powered College Student Support & Campus Operations Platform",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CampusPilot AI Core Engine",
        "timestamp": "2026-11-14T09:40:00Z"
    }

@app.get("/api/system-status")
def system_status():
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    is_live_gemini = bool(api_key and len(api_key) > 10)
    
    return {
        "engine_mode": "gemini_live" if is_live_gemini else "deterministic_rule_engine",
        "engine_display_name": "Google Gemini 2.0 Flash (Live Multi-Turn)" if is_live_gemini else "Deterministic Rule-Based Agent Engine (Active Fallback)",
        "gemini_api_configured": is_live_gemini,
        "active_specialist_agents": [
            {"id": "attendance", "name": "Attendance Agent", "department": "Attendance & Academic Records Department", "status": "active"},
            {"id": "finance", "name": "Finance Agent", "department": "Accounts & Finance Department", "status": "active"},
            {"id": "document", "name": "Document Agent", "department": "Student Affairs & Registrar Office", "status": "active"},
            {"id": "academic", "name": "Academic Agent", "department": "Office of Controller of Examinations & Academic Dean", "status": "active"}
        ],
        "version": "v2.6-hackathon-ready"
    }

# ----------------- Students API -----------------

@app.get("/api/students", response_model=List[StudentBase])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/students/{student_id}", response_model=StudentBase)
def get_student(student_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return dict(row)

# ----------------- AI Orchestrator API -----------------

@app.post("/api/orchestrator/process", response_model=OrchestratorResult)
def orchestrator_process(payload: ProcessQueryRequest):
    """
    Agentic perception, reasoning, specialist selection, and action planning.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (payload.student_id,))
    student_row = cursor.fetchone()
    conn.close()

    student_profile = dict(student_row) if student_row else None
    result = process_student_query(payload.query, student_profile)
    return result

# ----------------- Tickets API -----------------

@app.post("/api/tickets/create")
def api_create_ticket(payload: TicketCreateRequest):
    res = create_ticket(
        student_id=payload.student_id,
        student_name=payload.student_name,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        assigned_agent=payload.assigned_agent,
        department=payload.department,
        priority=payload.priority,
        action_plan=payload.action_plan,
        missing_info=payload.missing_info,
        requires_human_approval=payload.requires_human_approval,
        source_query=payload.source_query
    )
    return res

@app.get("/api/tickets", response_model=List[TicketResponse])
def get_tickets(
    student_id: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM tickets WHERE 1=1"
    params = []

    if student_id:
        query += " AND student_id = ?"
        params.append(student_id)

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if status_filter and status_filter != "all":
        query += " AND status = ?"
        params.append(status_filter)

    if priority and priority != "all":
        query += " AND priority = ?"
        params.append(priority)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query += " AND (title LIKE ? OR description LIKE ? OR ticket_number LIKE ? OR student_name LIKE ?)"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        item = dict(r)
        item["action_plan"] = json.loads(item["action_plan"]) if item["action_plan"] else []
        item["missing_info"] = json.loads(item["missing_info"]) if item["missing_info"] else []
        item["requires_human_approval"] = bool(item["requires_human_approval"])

        # Fetch staff notes
        cursor.execute("SELECT * FROM staff_notes WHERE ticket_id = ? ORDER BY created_at ASC", (item["id"],))
        notes = [dict(n) for n in cursor.fetchall()]
        item["staff_notes"] = notes
        results.append(item)

    conn.close()
    return results

@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(ticket_id: str):
    ticket = retrieve_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.patch("/api/tickets/{ticket_id}/status")
def patch_ticket_status(ticket_id: str, payload: TicketStatusUpdateRequest):
    try:
        updated = update_ticket_status(
            ticket_id=ticket_id,
            status=payload.status,
            staff_id=payload.staff_id,
            staff_name=payload.staff_name,
            note=payload.note
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.patch("/api/tickets/{ticket_id}/department")
def patch_ticket_department(ticket_id: str, payload: TicketDepartmentUpdateRequest):
    try:
        updated = assign_department(
            ticket_id=ticket_id,
            department=payload.department,
            staff_id=payload.staff_id,
            staff_name=payload.staff_name,
            note=payload.note
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/tickets/{ticket_id}/notes")
def post_staff_note(ticket_id: str, payload: StaffNoteCreateRequest):
    ticket = retrieve_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    import uuid
    from datetime import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    note_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (note_id, ticket["id"], payload.staff_id, payload.staff_name, payload.note, now_iso))

    conn.commit()
    conn.close()
    return {"id": note_id, "ticket_id": ticket["id"], "created_at": now_iso}

# ----------------- Notifications API -----------------

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(student_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    if student_id:
        cursor.execute("SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC", (student_id,))
    else:
        cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC")

    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["is_read"] = bool(d["is_read"])
        results.append(d)
    return results

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"success": True, "id": notification_id}

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(student_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE student_id = ?", (student_id,))
    conn.commit()
    conn.close()
    return {"success": True, "student_id": student_id}

# ----------------- Analytics API (Admin Operations) -----------------

@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as cnt FROM tickets")
    total_tickets = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM tickets WHERE status = 'Pending'")
    pending_tickets = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM tickets WHERE status = 'In Progress'")
    in_progress_tickets = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM tickets WHERE status = 'Resolved'")
    resolved_tickets = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM tickets WHERE priority = 'high'")
    high_priority_tickets = cursor.fetchone()["cnt"]

    # Department distribution
    cursor.execute("""
        SELECT department, COUNT(*) as count 
        FROM tickets 
        GROUP BY department 
        ORDER BY count DESC
    """)
    dept_rows = cursor.fetchall()
    department_distribution = [{"name": r["department"], "value": r["count"]} for r in dept_rows]

    # Category distribution
    cursor.execute("""
        SELECT category, COUNT(*) as count 
        FROM tickets 
        GROUP BY category 
        ORDER BY count DESC
    """)
    cat_rows = cursor.fetchall()
    category_distribution = [{"name": r["category"].capitalize(), "value": r["count"]} for r in cat_rows]

    # Priority distribution
    cursor.execute("""
        SELECT priority, COUNT(*) as count 
        FROM tickets 
        GROUP BY priority 
        ORDER BY count DESC
    """)
    prio_rows = cursor.fetchall()
    priority_distribution = [{"name": r["priority"].capitalize(), "value": r["count"]} for r in prio_rows]

    conn.close()

    resolution_rate = round((resolved_tickets / max(1, total_tickets)) * 100, 1)

    return {
        "total_tickets": total_tickets,
        "pending_tickets": pending_tickets,
        "in_progress_tickets": in_progress_tickets,
        "resolved_tickets": resolved_tickets,
        "high_priority_tickets": high_priority_tickets,
        "department_distribution": department_distribution,
        "category_distribution": category_distribution,
        "priority_distribution": priority_distribution,
        "resolution_rate_percent": resolution_rate,
        "avg_response_hours": 3.8
    }

# ----------------- Live Demo Reset API -----------------

@app.post("/api/reset-demo")
def reset_demo_data():
    seed_database()
    return {"message": "Demo data successfully reset to initial hackathon showcase state."}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ----------------- Static Frontend Hosting (Single-Port Mode) -----------------

DIST_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(DIST_PATH):
    assets_path = os.path.join(DIST_PATH, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = os.path.join(DIST_PATH, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_PATH, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CampusPilot AI Core Engine running."}

