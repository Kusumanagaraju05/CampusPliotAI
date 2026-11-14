import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..database import get_db_connection

def classify_request(text: str) -> Dict[str, Any]:
    """
    Classifies natural language student problem into domain categories,
    calculates confidence score, and determines initial urgency/priority.
    """
    text_lower = text.lower()

    # Domain keyword patterns
    attendance_keywords = [
        "attendance", "absent", "percentage", "present", "biometric", "qr code", "bunk", 
        "shortage", "condonation", "duty leave", "medical leave", "roll call"
    ]
    finance_keywords = [
        "fee", "fees", "receipt", "payment", "paid", "refund", "transaction", "bank",
        "scholarship", "dues", "challan", "fine", "semester fee", "tuition", "hostel fee"
    ]
    document_keywords = [
        "bonafide", "certificate", "id card", "identity card", "study certificate", 
        "custody certificate", "marksheet", "transcript", "lor", "noc", "migration", "provisional"
    ]
    academic_keywords = [
        "timetable", "time table", "schedule", "exam", "examination", "classroom", 
        "hall ticket", "subject", "credit", "syllabus", "professor", "hod", "internal", 
        "grading", "revaluation", "electives", "lab slot"
    ]

    scores = {
        "attendance": sum(1 for kw in attendance_keywords if kw in text_lower),
        "finance": sum(1 for kw in finance_keywords if kw in text_lower),
        "document": sum(1 for kw in document_keywords if kw in text_lower),
        "academic": sum(1 for kw in academic_keywords if kw in text_lower),
    }

    # Identify primary category
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_category, top_score = sorted_scores[0]

    if top_score == 0:
        # Default fallback to academic or general
        top_category = "academic"
        confidence = 0.65
    else:
        confidence = min(0.98, 0.70 + (top_score * 0.08))

    # Determine priority based on urgency triggers
    urgency_high_triggers = ["urgent", "exam tomorrow", "cannot write exam", "barred", "debared", "failed payment", "deadline today", "fine pending"]
    urgency_low_triggers = ["inquiry", "how to", "just checking", "general", "syllabus copy"]

    if any(t in text_lower for t in urgency_high_triggers):
        priority = "high"
    elif any(t in text_lower for t in urgency_low_triggers):
        priority = "low"
    else:
        priority = "medium"

    return {
        "category": top_category,
        "confidence": confidence,
        "priority": priority,
        "matched_keywords": [kw for kw in attendance_keywords + finance_keywords + document_keywords + academic_keywords if kw in text_lower]
    }

def select_agent(category: str) -> Dict[str, str]:
    """
    Selects the specialized AI agent and responsible department based on issue category.
    """
    mapping = {
        "attendance": {
            "agent_name": "Attendance Agent",
            "department": "Attendance & Academic Records Department",
            "mandate": "Auditing attendance percentages, verifying class logs, processing biometric/QR discrepancies, and routing medical/duty leave requests without unauthorized record modifications."
        },
        "finance": {
            "agent_name": "Finance Agent",
            "department": "Accounts & Finance Department",
            "mandate": "Verifying transaction references with payment gateways, reconciling bank settlements, issuing official payment vouchers/receipts, and processing scholarship disbursements."
        },
        "document": {
            "agent_name": "Document Agent",
            "department": "Student Affairs & Registrar Office",
            "mandate": "Validating document eligibility criteria, preparing required attachment checklists, authenticating bonafide/study certificate requests, and managing physical ID card reissuances."
        },
        "academic": {
            "agent_name": "Academic Agent",
            "department": "Office of Controller of Examinations & Academic Dean",
            "mandate": "Providing verified timetable allocations, exam room seating coordination, syllabus clarifications, and forwarding formal internal marks review petitions."
        }
    }

    return mapping.get(category, mapping["academic"])

def generate_action_plan(category: str, query: str) -> Dict[str, Any]:
    """
    Generates actionable resolution steps, missing information requirements,
    and institutional routing instructions tailored to the problem.
    """
    query_lower = query.lower()

    if category == "attendance":
        missing = [
            "Specific course code(s) or subject name",
            "Date range or lecture hours with discrepancy",
            "Supporting documentation (medical certificate, faculty approval, or duty slip)"
        ]
        plan = [
            "Perception & Audit: Cross-reference biometric/QR log timestamps against class schedule.",
            "Discrepancy Logging: Document student claim and compute theoretical attendance impact.",
            "Evidence Preparation: Compile medical certificate/duty leave slip for departmental verification.",
            "Staff Escalation: Dispatch formal correction dossier to Course Faculty and HOD for authorized sign-off."
        ]
        summary = "Student reports attendance discrepancy requiring record reconciliation."

    elif category == "finance":
        missing = [
            "Banking reference / UTR / Transaction ID",
            "Date and approximate timestamp of transaction",
            "Payment method (NetBanking, UPI, Debit Card, Challan)",
            "Bank account debit confirmation screenshot or SMS excerpt"
        ]
        plan = [
            "Transaction Tracing: Log bank payment reference code and payment gateway order identifier.",
            "Gateway Reconciliation: Probe accounts ledger to check if funds cleared into college treasury.",
            "Receipt Dispatch: Instruct Accounts desk to generate official stamped fee receipt if reconciled.",
            "Bank Chargeback Support: In case of bank-side bounce, generate official non-receipt certificate for student bank refund."
        ]
        summary = "Payment confirmation or fee receipt generation request pending bank reconciliation."

    elif category == "document":
        missing = [
            "Purpose of certificate (e.g., Education Loan, Passport, Bus Pass, Internship, Visa)",
            "Academic year and current semester verification",
            "Clearance from college library and laboratory accounts (if ID replacement)"
        ]
        plan = [
            "Eligibility Verification: Verify active student enrollment status in registrar records.",
            "Checklist Compilation: Confirm submission of purpose statement and photo ID copy.",
            "Drafting & Seal: Route digital certificate draft to Registrar desk for institutional seal.",
            "Collection Dispatch: Schedule student counter pickup or encrypted digital PDF issuance."
        ]
        summary = "Official college document/certificate application requiring registrar sign-off."

    else: # academic
        missing = [
            "Degree program, section, and semester code",
            "Target examination or subject title"
        ]
        plan = [
            "Schedule Inspection: Retrieve approved institutional calendar from Controller of Examinations.",
            "Room & Slot Mapping: Check hall seating allocations and lab rotation schedules.",
            "Conflict Flagging: If clash is detected, prepare formal slot adjustment petition.",
            "Staff Briefing: Deliver verified academic timetable instructions to student dashboard."
        ]
        summary = "Academic schedule or examination administrative enquiry."

    return {
        "summary": summary,
        "action_plan": plan,
        "missing_information": missing,
        "requires_human_approval": True
    }

def create_ticket(
    student_id: str,
    student_name: str,
    title: str,
    description: str,
    category: str,
    assigned_agent: str,
    department: str,
    priority: str,
    action_plan: List[str],
    missing_info: Optional[List[str]] = None,
    requires_human_approval: bool = True,
    source_query: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates a new support ticket with duplicate submission prevention
    and logs an automated notification.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Duplicate check: check if student has a pending/in-progress ticket with identical title or source_query in last 10 minutes
    cursor.execute("""
        SELECT id, ticket_number, title, status, created_at 
        FROM tickets 
        WHERE student_id = ? AND (title = ? OR source_query = ?) AND status != 'Resolved'
        LIMIT 1
    """, (student_id, title, source_query or title))
    existing = cursor.fetchone()

    if existing:
        conn.close()
        return {
            "is_duplicate": True,
            "message": f"A ticket for this issue is already active ({existing['ticket_number']}: '{existing['title']}'). Status: {existing['status']}.",
            "ticket_id": existing["id"],
            "ticket_number": existing["ticket_number"],
            "status": existing["status"]
        }

    # Generate sequential ticket number CP-2026-XXXX
    cursor.execute("SELECT COUNT(*) as count FROM tickets")
    count_row = cursor.fetchone()
    next_num = (count_row["count"] or 0) + 1
    ticket_number = f"CP-2026-{next_num:04d}"

    ticket_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
        INSERT INTO tickets (
            id, ticket_number, student_id, student_name, title, description,
            category, assigned_agent, department, priority, status,
            action_plan, missing_info, requires_human_approval, source_query,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)
    """, (
        ticket_id, ticket_number, student_id, student_name, title, description,
        category, assigned_agent, department, priority,
        json.dumps(action_plan), json.dumps(missing_info or []),
        1 if requires_human_approval else 0, source_query,
        now_iso, now_iso
    ))

    # Log initial notification for student
    notif_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO notifications (
            id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'ticket_created', 0, ?)
    """, (
        notif_id, student_id, ticket_id, ticket_number,
        f"Ticket {ticket_number} Created",
        f"Your issue '{title}' was received and routed to {department} by {assigned_agent}.",
        now_iso
    ))

    # Log workflow audit step
    cursor.execute("""
        INSERT INTO workflow_logs (
            id, ticket_id, stage, agent_name, action, details, created_at
        ) VALUES (?, ?, 'Ticket Creation', ?, 'Route to Department', ?, ?)
    """, (
        str(uuid.uuid4()), ticket_id, assigned_agent,
        f"Ticket routed to {department} with priority '{priority}'", now_iso
    ))

    conn.commit()
    conn.close()

    return {
        "is_duplicate": False,
        "ticket_id": ticket_id,
        "ticket_number": ticket_number,
        "status": "Pending",
        "created_at": now_iso
    }

def update_ticket_status(
    ticket_id: str,
    status: str,
    staff_id: str,
    staff_name: str,
    note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Updates the ticket status, appends a staff note, logs a notification,
    and updates the ticket timestamp.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?", (ticket_id, ticket_id))
    ticket = cursor.fetchone()

    if not ticket:
        conn.close()
        raise ValueError(f"Ticket not found for ID/Number: {ticket_id}")

    actual_id = ticket["id"]
    ticket_num = ticket["ticket_number"]
    student_id = ticket["student_id"]
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Update status
    cursor.execute("""
        UPDATE tickets
        SET status = ?, updated_at = ?
        WHERE id = ?
    """, (status, now_iso, actual_id))

    # Add staff note if provided
    if note and note.strip():
        cursor.execute("""
            INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), actual_id, staff_id, staff_name, note.strip(), now_iso))

    # Notification for student
    notif_title = f"Ticket {ticket_num} Status: {status}"
    notif_msg = f"{staff_name} updated your request to '{status}'."
    if note:
        notif_msg += f" Note: \"{note}\""

    cursor.execute("""
        INSERT INTO notifications (
            id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'status_change', 0, ?)
    """, (str(uuid.uuid4()), student_id, actual_id, ticket_num, notif_title, notif_msg, now_iso))

    # Audit log
    cursor.execute("""
        INSERT INTO workflow_logs (id, ticket_id, stage, agent_name, action, details, created_at)
        VALUES (?, ?, 'Human Review', ?, 'Update Status', ?, ?)
    """, (str(uuid.uuid4()), actual_id, staff_name, f"Status changed to {status}. Note: {note or 'None'}", now_iso))

    conn.commit()
    conn.close()

    return {
        "ticket_id": actual_id,
        "ticket_number": ticket_num,
        "status": status,
        "updated_at": now_iso
    }

def assign_department(
    ticket_id: str,
    department: str,
    staff_id: str,
    staff_name: str,
    note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Reassigns ticket to a new department with an audit record.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?", (ticket_id, ticket_id))
    ticket = cursor.fetchone()

    if not ticket:
        conn.close()
        raise ValueError(f"Ticket not found: {ticket_id}")

    actual_id = ticket["id"]
    ticket_num = ticket["ticket_number"]
    now_iso = datetime.utcnow().isoformat() + "Z"

    cursor.execute("UPDATE tickets SET department = ?, updated_at = ? WHERE id = ?", (department, now_iso, actual_id))

    if note and note.strip():
        cursor.execute("""
            INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), actual_id, staff_id, staff_name, f"Reassigned to {department}. {note}", now_iso))

    conn.commit()
    conn.close()

    return {"ticket_id": actual_id, "ticket_number": ticket_num, "department": department, "updated_at": now_iso}

def retrieve_ticket(ticket_id_or_number: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves full ticket details including parsed action plans and staff notes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?", (ticket_id_or_number, ticket_id_or_number))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    ticket_dict = dict(row)
    ticket_dict["action_plan"] = json.loads(ticket_dict["action_plan"]) if ticket_dict["action_plan"] else []
    ticket_dict["missing_info"] = json.loads(ticket_dict["missing_info"]) if ticket_dict["missing_info"] else []
    ticket_dict["requires_human_approval"] = bool(ticket_dict["requires_human_approval"])

    # Fetch notes
    cursor.execute("SELECT * FROM staff_notes WHERE ticket_id = ? ORDER BY created_at ASC", (ticket_dict["id"],))
    notes = [dict(n) for n in cursor.fetchall()]
    ticket_dict["staff_notes"] = notes

    conn.close()
    return ticket_dict

def list_student_tickets(student_id: str) -> List[Dict[str, Any]]:
    """
    Lists all tickets submitted by a specific student.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tickets WHERE student_id = ? ORDER BY created_at DESC", (student_id,))
    rows = cursor.fetchall()

    results = []
    for r in rows:
        item = dict(r)
        item["action_plan"] = json.loads(item["action_plan"]) if item["action_plan"] else []
        item["missing_info"] = json.loads(item["missing_info"]) if item["missing_info"] else []
        item["requires_human_approval"] = bool(item["requires_human_approval"])
        results.append(item)

    conn.close()
    return results

def generate_student_response(agent_name: str, category: str, summary: str, action_plan: List[str], missing_info: List[str]) -> str:
    """
    Generates a clear, professional conversational response from the specialist agent.
    """
    plan_text = "\n".join([f"• {step}" for step in action_plan])
    missing_text = "\n".join([f"- {info}" for info in missing_info])

    return (
        f"Hello, I am your **{agent_name}**. I have reviewed your request regarding {category}.\n\n"
        f"**Summary:** {summary}\n\n"
        f"**Proposed Action Plan:**\n{plan_text}\n\n"
        f"**Missing or Required Information:**\n{missing_text}\n\n"
        f"Please verify the details above. When ready, click **Confirm & Submit Ticket** to formally route your request to the department for review."
    )
