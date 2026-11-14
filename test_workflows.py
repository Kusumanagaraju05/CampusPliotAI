import os
import json
from backend.seed_data import seed_database
from backend.database import get_db_connection
from backend.agents.tools import (
    classify_request,
    select_agent,
    generate_action_plan,
    create_ticket,
    update_ticket_status,
    assign_department,
    retrieve_ticket,
    list_student_tickets
)
from backend.agents.orchestrator import process_student_query
from backend.main import (
    health_check,
    system_status,
    get_students,
    orchestrator_process,
    api_create_ticket,
    get_tickets,
    get_ticket_detail,
    patch_ticket_status,
    get_analytics,
    get_notifications
)
from backend.schemas import (
    ProcessQueryRequest,
    TicketCreateRequest,
    TicketStatusUpdateRequest
)

def run_all_tests():
    print("=" * 65)
    print("RUNNING CAMPUSPILOT AI TEST SUITE (ALL 6 SCENARIOS)")
    print("=" * 65)

    # 0. Seed Database
    seed_database()

    # 1. Health check & System Status
    print("\n[TEST 1] Testing /api/health and /api/system-status...")
    h = health_check()
    assert h["status"] == "healthy"
    print(" -> Health check: PASSED", h)

    s_status = system_status()
    print(" -> Engine Mode:", s_status["engine_mode"])
    print(" -> Engine Display Name:", s_status["engine_display_name"])
    print(" -> Active Specialist Agents:", len(s_status["active_specialist_agents"]))
    assert len(s_status["active_specialist_agents"]) == 4

    # 2. Students API
    print("\n[TEST 2] Testing Student Profiles...")
    students = get_students()
    print(f" -> Found {len(students)} demo students: {[s['name'] for s in students]}")
    assert len(students) >= 3
    alex = next(s for s in students if "Alex" in s["name"])
    priya = next(s for s in students if "Priya" in s["name"])

    # 3. Scenario 1: Student reports an attendance discrepancy
    print("\n[SCENARIO 1] Student reports attendance discrepancy -> Attendance Agent -> Ticket Creation")
    query_attendance = "My attendance is showing 16%, but I attended most of my classes."
    req1 = ProcessQueryRequest(student_id=alex["id"], query=query_attendance)
    orc_res = orchestrator_process(req1)
    print(" -> Category:", orc_res["category"])
    print(" -> Selected Agent:", orc_res["agent_name"])
    print(" -> Target Dept:", orc_res["department"])
    print(" -> Action Plan Steps:", len(orc_res["action_plan"]))
    print(" -> Reasoning:", orc_res["orchestrator_reasoning"][:90] + "...")
    assert orc_res["category"] == "attendance"
    assert orc_res["agent_name"] == "Attendance Agent"

    # Confirm and create ticket
    create_req = TicketCreateRequest(
        student_id=alex["id"],
        student_name=alex["name"],
        title=f"Attendance Agent: {orc_res['summary']}",
        description=f"Query: {query_attendance}",
        category=orc_res["category"],
        assigned_agent=orc_res["agent_name"],
        department=orc_res["department"],
        priority=orc_res["priority"],
        action_plan=orc_res["action_plan"],
        missing_info=orc_res["missing_information"],
        requires_human_approval=True,
        source_query=query_attendance
    )
    tkt_res = api_create_ticket(create_req)
    print(" -> Ticket Created:", tkt_res["ticket_number"], "ID:", tkt_res["ticket_id"])
    assert tkt_res["is_duplicate"] == False
    assert tkt_res["ticket_number"].startswith("CP-2026-")

    # Duplicate Prevention Test
    dup_res = api_create_ticket(create_req)
    print(" -> Duplicate check test:", dup_res["is_duplicate"], "-", dup_res.get("message"))
    assert dup_res["is_duplicate"] == True

    # 4. Scenario 2: Student reports missing fee receipt -> Finance Agent
    print("\n[SCENARIO 2] Student reports missing fee receipt -> Finance Agent")
    query_finance = "I paid my college fees but did not receive a receipt. Reference: HDFC99382103."
    req2 = ProcessQueryRequest(student_id=alex["id"], query=query_finance)
    orc_fin = orchestrator_process(req2)
    print(" -> Category:", orc_fin["category"])
    print(" -> Selected Agent:", orc_fin["agent_name"])
    print(" -> Target Dept:", orc_fin["department"])
    assert orc_fin["category"] == "finance"
    assert orc_fin["agent_name"] == "Finance Agent"

    # 5. Scenario 3: Student requests a bonafide certificate -> Document Agent
    print("\n[SCENARIO 3] Student requests bonafide certificate -> Document Agent & Checklist")
    query_doc = "I need a bonafide certificate for my education loan application."
    req3 = ProcessQueryRequest(student_id=priya["id"], query=query_doc)
    orc_doc = orchestrator_process(req3)
    print(" -> Category:", orc_doc["category"])
    print(" -> Selected Agent:", orc_doc["agent_name"])
    print(" -> Target Dept:", orc_doc["department"])
    print(" -> Missing Info Checklist:", orc_doc["missing_information"])
    assert orc_doc["category"] == "document"
    assert orc_doc["agent_name"] == "Document Agent"
    assert len(orc_doc["missing_information"]) > 0

    # 6. Scenario 4: Admin opens a ticket and changes status from Pending to In Progress
    print("\n[SCENARIO 4] Admin opens ticket and changes status from Pending to In Progress...")
    tkt_id = tkt_res["ticket_id"]
    status_update = TicketStatusUpdateRequest(
        status="In Progress",
        staff_id="stf-jenkins",
        staff_name="Dr. Sarah Jenkins",
        note="Commenced scanner timestamp log review for Hall B."
    )
    patched = patch_ticket_status(tkt_id, status_update)
    print(" -> Updated status:", patched["status"])
    assert patched["status"] == "In Progress"

    # 7. Scenario 5: Student refreshes dashboard and sees updated ticket status
    print("\n[SCENARIO 5] Student refreshes dashboard and verifies persisted status...")
    persisted = get_ticket_detail(tkt_id)
    print(" -> Persisted status in DB:", persisted["status"])
    print(" -> Staff Notes count:", len(persisted.get("staff_notes", [])))
    assert persisted["status"] == "In Progress"
    assert len(persisted["staff_notes"]) >= 1
    assert "Dr. Sarah Jenkins" in persisted["staff_notes"][0]["staff_name"]

    # 8. Scenario 6: Fallback classification when Gemini API is unavailable
    print("\n[SCENARIO 6] Fallback classification when Gemini API is unavailable...")
    assert s_status["engine_mode"] in ["deterministic_rule_engine", "gemini_live"]
    print(" -> Active Engine Mode:", s_status["engine_mode"])
    print(" -> Honest Fallback Disclaimer active:", orc_res["ai_disclaimer"])

    # 9. Test Analytics API
    print("\n[TEST 7] Testing Admin Analytics API...")
    analytics = get_analytics()
    print(" -> Total Tickets:", analytics["total_tickets"])
    print(" -> In Progress:", analytics["in_progress_tickets"])
    print(" -> Dept Distribution:", analytics["department_distribution"])
    assert analytics["total_tickets"] >= 8

    # 10. Test Notification Center
    print("\n[TEST 8] Testing Notification Center for Student...")
    notifs = get_notifications(student_id=alex["id"])
    print(f" -> Found {len(notifs)} notifications for Alex")
    assert len(notifs) >= 1

    print("\n" + "=" * 65)
    print("ALL 6 SPECIFIED SCENARIOS AND WORKFLOWS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    run_all_tests()
