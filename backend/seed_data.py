import json
import uuid
from datetime import datetime, timedelta
from .database import get_db_connection, init_db

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing demo data
    cursor.execute("DELETE FROM workflow_logs")
    cursor.execute("DELETE FROM staff_notes")
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM tickets")
    cursor.execute("DELETE FROM students")

    now = datetime.utcnow()

    # 1. Seed 3 Demo Students
    students = [
        {
            "id": "std-alex-01",
            "name": "Alex Johnson",
            "email": "alex.johnson@campus.edu",
            "role": "student",
            "student_id_code": "CS-2023-042",
            "department": "Computer Science & Engineering",
            "year": "3rd Year (Semester 5)",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "created_at": (now - timedelta(days=60)).isoformat() + "Z"
        },
        {
            "id": "std-priya-02",
            "name": "Priya Patel",
            "email": "priya.patel@campus.edu",
            "role": "student",
            "student_id_code": "EC-2024-118",
            "department": "Electronics & Communication",
            "year": "2nd Year (Semester 3)",
            "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
            "created_at": (now - timedelta(days=45)).isoformat() + "Z"
        },
        {
            "id": "std-marcus-03",
            "name": "Marcus Chen",
            "email": "marcus.chen@campus.edu",
            "role": "student",
            "student_id_code": "ME-2022-089",
            "department": "Mechanical Engineering",
            "year": "4th Year (Semester 7)",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "created_at": (now - timedelta(days=90)).isoformat() + "Z"
        }
    ]

    for s in students:
        cursor.execute("""
            INSERT INTO students (id, name, email, role, student_id_code, department, year, avatar_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (s["id"], s["name"], s["email"], s["role"], s["student_id_code"], s["department"], s["year"], s["avatar_url"], s["created_at"]))

    # 2. Seed 8 Realistic Demo Tickets across 4 departments, 3 statuses, 3 priorities
    tickets = [
        {
            "id": "tkt-001",
            "ticket_number": "CP-2026-0001",
            "student_id": "std-alex-01",
            "student_name": "Alex Johnson",
            "title": "Attendance Shortage Mismatch in CS301 (Algorithms)",
            "description": "My portal reflects 68% attendance in CS301, but I have only missed 2 lectures out of 28. The biometric scanner at Hall B was malfunctioning on Oct 14th and 18th.",
            "category": "attendance",
            "assigned_agent": "Attendance Agent",
            "department": "Attendance & Academic Records Department",
            "priority": "high",
            "status": "In Progress",
            "action_plan": [
                "Pull biometric scanner hardware error logs for Hall B on Oct 14 & 18",
                "Verify manual attendance register signed by Dr. Vance",
                "Recalculate weighted percentage adjustment (+7.1%)",
                "Submit correction memorandum to Registrar"
            ],
            "missing_info": ["Signature on manual attendance slip from Dr. Vance"],
            "requires_human_approval": 1,
            "source_query": "My attendance is showing 68% in CS301 but I attended almost every class. Scanner was broken on Oct 14.",
            "created_at": (now - timedelta(days=3, hours=4)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=6)).isoformat() + "Z",
            "notes": [
                {
                    "staff_id": "stf-jenkins",
                    "staff_name": "Dr. Sarah Jenkins (Dean)",
                    "note": "Biometric device log audit confirmed offline timestamp at Hall B during Oct 14 09:00-11:00. Waiting for manual sheet from course faculty.",
                    "created_at": (now - timedelta(hours=6)).isoformat() + "Z"
                }
            ]
        },
        {
            "id": "tkt-002",
            "ticket_number": "CP-2026-0002",
            "student_id": "std-alex-01",
            "student_name": "Alex Johnson",
            "title": "Semester 5 Tuition Fee Deducted but Receipt Not Generated",
            "description": "Paid INR 45,000 via NetBanking on Nov 10th. Amount was debited from HDFC account (Ref: HDFC99382103), but student portal still displays 'Payment Pending'.",
            "category": "finance",
            "assigned_agent": "Finance Agent",
            "department": "Accounts & Finance Department",
            "priority": "high",
            "status": "In Progress",
            "action_plan": [
                "Track gateway transaction ID HDFC99382103 with Razorpay nodal desk",
                "Confirm settlement ledger entry with Axis treasury account",
                "Clear financial hold on student ERP profile",
                "Generate official digitally signed fee receipt"
            ],
            "missing_info": [],
            "requires_human_approval": 1,
            "source_query": "I paid my college fees but did not receive a receipt. Bank debited the amount.",
            "created_at": (now - timedelta(days=2, hours=8)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=3)).isoformat() + "Z",
            "notes": [
                {
                    "staff_id": "stf-accounts",
                    "staff_name": "Mr. Vikram Rao (Accounts Officer)",
                    "note": "Bank payment settlement verified in batch ledger. Reconciling ERP webhook now.",
                    "created_at": (now - timedelta(hours=3)).isoformat() + "Z"
                }
            ]
        },
        {
            "id": "tkt-003",
            "ticket_number": "CP-2026-0003",
            "student_id": "std-priya-02",
            "student_name": "Priya Patel",
            "title": "Urgent Bonafide Certificate for National Scholarship Portal",
            "description": "Require an official Bonafide Certificate with college seal specifying annual tuition and hostel charges for State Merit Scholarship application (Deadline: Nov 25th).",
            "category": "document",
            "assigned_agent": "Document Agent",
            "department": "Student Affairs & Registrar Office",
            "priority": "medium",
            "status": "Resolved",
            "action_plan": [
                "Validate active enrollment in 2nd Year ECE program",
                "Retrieve official fee structure template with hostel annexure",
                "Generate digital certificate draft with unique verification QR",
                "Apply Registrar digital signature and notify student"
            ],
            "missing_info": [],
            "requires_human_approval": 1,
            "source_query": "I need a bonafide certificate for my scholarship portal before the deadline.",
            "created_at": (now - timedelta(days=5)).isoformat() + "Z",
            "updated_at": (now - timedelta(days=1)).isoformat() + "Z",
            "notes": [
                {
                    "staff_id": "stf-registrar",
                    "staff_name": "Prof. Ramesh Kumar (Registrar)",
                    "note": "Bonafide Certificate #REG/2026/0891 generated, sealed, and uploaded to student portal documents folder.",
                    "created_at": (now - timedelta(days=1)).isoformat() + "Z"
                }
            ]
        },
        {
            "id": "tkt-004",
            "ticket_number": "CP-2026-0004",
            "student_id": "std-priya-02",
            "student_name": "Priya Patel",
            "title": "Mid-Term Examination Timetable Clash (EC302 & MA301)",
            "description": "According to the draft schedule published yesterday, Digital Signal Processing (EC302) and Engineering Mathematics III (MA301) are both scheduled for Dec 04 at 10:00 AM.",
            "category": "academic",
            "assigned_agent": "Academic Agent",
            "department": "Office of Controller of Examinations & Academic Dean",
            "priority": "medium",
            "status": "Pending",
            "action_plan": [
                "Examine examination scheduling matrix for dual-enrollment conflict",
                "Convene scheduling committee review with Controller of Exams",
                "Reallocate EC302 to afternoon slot (02:00 PM - 05:00 PM)",
                "Publish revised timetable addendum on institutional noticeboard"
            ],
            "missing_info": ["Confirmation if student is repeating either course as backlog"],
            "requires_human_approval": 1,
            "source_query": "I have two exams scheduled on the exact same date and time. Please help resolve clash.",
            "created_at": (now - timedelta(hours=14)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=14)).isoformat() + "Z",
            "notes": []
        },
        {
            "id": "tkt-005",
            "ticket_number": "CP-2026-0005",
            "student_id": "std-marcus-03",
            "student_name": "Marcus Chen",
            "title": "Replacement RFID Smart Campus ID Card Reissuance",
            "description": "Lost college ID badge during campus placement drive in Auditorium. Filed lost property notice with campus security desk.",
            "category": "document",
            "assigned_agent": "Document Agent",
            "department": "Student Affairs & Registrar Office",
            "priority": "low",
            "status": "In Progress",
            "action_plan": [
                "Deactivate lost RFID chip #RF-8821 in campus turnstile security network",
                "Verify duplicate card processing fee receipt (INR 250)",
                "Transmit student photograph and credentials to ID printing bureau",
                "Issue temporary paper pass valid for library access"
            ],
            "missing_info": ["Security desk lost report acknowledgment number"],
            "requires_human_approval": 1,
            "source_query": "I lost my college ID card yesterday and need a replacement.",
            "created_at": (now - timedelta(days=1, hours=10)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=5)).isoformat() + "Z",
            "notes": [
                {
                    "staff_id": "stf-registrar",
                    "staff_name": "Prof. Ramesh Kumar (Registrar)",
                    "note": "Card RFID deactivated. New card printed; ready for pickup at Window 4 with valid government ID.",
                    "created_at": (now - timedelta(hours=5)).isoformat() + "Z"
                }
            ]
        },
        {
            "id": "tkt-006",
            "ticket_number": "CP-2026-0006",
            "student_id": "std-marcus-03",
            "student_name": "Marcus Chen",
            "title": "Final Year Major Project Lab Room Allocation Request",
            "description": "Requesting access permissions for Advanced Robotics Lab (Mech Block Room 304) for weekend testing of autonomous rover prototype.",
            "category": "academic",
            "assigned_agent": "Academic Agent",
            "department": "Office of Controller of Examinations & Academic Dean",
            "priority": "low",
            "status": "Resolved",
            "action_plan": [
                "Review Faculty Guide recommendation letter",
                "Verify lab safety compliance certificate for lithium-polymer battery usage",
                "Issue lab supervisor weekend duty authorization slip",
                "Program biometric door lock for Saturday/Sunday 09:00-18:00 access"
            ],
            "missing_info": [],
            "requires_human_approval": 1,
            "source_query": "We need weekend lab access for our robotics capstone project.",
            "created_at": (now - timedelta(days=6)).isoformat() + "Z",
            "updated_at": (now - timedelta(days=2)).isoformat() + "Z",
            "notes": [
                {
                    "staff_id": "stf-jenkins",
                    "staff_name": "Dr. Sarah Jenkins (Dean)",
                    "note": "Approved weekend access for Team Rover. Campus security notified.",
                    "created_at": (now - timedelta(days=2)).isoformat() + "Z"
                }
            ]
        },
        {
            "id": "tkt-007",
            "ticket_number": "CP-2026-0007",
            "student_id": "std-alex-01",
            "student_name": "Alex Johnson",
            "title": "Hospitalization Medical Leave Attendance Condonation",
            "description": "Submitted hospital discharge summary for dengue recovery (Oct 21 - Oct 31, 8 working days). Need attendance waiver as per University Medical Bylaws Section 4(b).",
            "category": "attendance",
            "assigned_agent": "Attendance Agent",
            "department": "Attendance & Academic Records Department",
            "priority": "high",
            "status": "Pending",
            "action_plan": [
                "Forward medical summary to College Chief Medical Officer for validation",
                "Calculate total eligible condonation hours across 6 enrolled courses",
                "Prepare formal exemption minutes for Academic Council review",
                "Apply excused absence flag in University ERP portal"
            ],
            "missing_info": ["Original signed fitness certificate from attending physician"],
            "requires_human_approval": 1,
            "source_query": "I was hospitalized for dengue for 10 days. Need medical leave attendance consideration.",
            "created_at": (now - timedelta(hours=18)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=18)).isoformat() + "Z",
            "notes": []
        },
        {
            "id": "tkt-008",
            "ticket_number": "CP-2026-0008",
            "student_id": "std-priya-02",
            "student_name": "Priya Patel",
            "title": "Caution Deposit & Hostel Refund Status Post Room Reallocation",
            "description": "Shifted from Block A 3-sharing to Block C 2-sharing. Adjusted differential amount was deducted twice on the billing portal.",
            "category": "finance",
            "assigned_agent": "Finance Agent",
            "department": "Accounts & Finance Department",
            "priority": "medium",
            "status": "Pending",
            "action_plan": [
                "Audit hostel billing ledger for duplicate invoice generation",
                "Cross-check warden room reallocation authorization date",
                "Reverse excess debit of INR 6,500 to student wallet balance",
                "Issue updated zero-dues statement"
            ],
            "missing_info": ["Hostel warden room shifting clearance slip"],
            "requires_human_approval": 1,
            "source_query": "Hostel room shift caused double charge on my fee account.",
            "created_at": (now - timedelta(hours=8)).isoformat() + "Z",
            "updated_at": (now - timedelta(hours=8)).isoformat() + "Z",
            "notes": []
        }
    ]

    for t in tickets:
        cursor.execute("""
            INSERT INTO tickets (
                id, ticket_number, student_id, student_name, title, description,
                category, assigned_agent, department, priority, status,
                action_plan, missing_info, requires_human_approval, source_query,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["id"], t["ticket_number"], t["student_id"], t["student_name"], t["title"], t["description"],
            t["category"], t["assigned_agent"], t["department"], t["priority"], t["status"],
            json.dumps(t["action_plan"]), json.dumps(t["missing_info"]), t["requires_human_approval"],
            t["source_query"], t["created_at"], t["updated_at"]
        ))

        # Notes
        for n in t.get("notes", []):
            cursor.execute("""
                INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), t["id"], n["staff_id"], n["staff_name"], n["note"], n["created_at"]))

    # 3. Seed Realistic Notifications
    notifications = [
        {
            "id": "notif-01",
            "student_id": "std-alex-01",
            "ticket_id": "tkt-001",
            "ticket_number": "CP-2026-0001",
            "title": "Ticket Assigned & Investigating",
            "message": "Dr. Sarah Jenkins began investigation on attendance discrepancy in CS301.",
            "type": "status_change",
            "is_read": 1,
            "created_at": (now - timedelta(hours=6)).isoformat() + "Z"
        },
        {
            "id": "notif-02",
            "student_id": "std-alex-01",
            "ticket_id": "tkt-002",
            "ticket_number": "CP-2026-0002",
            "title": "Payment Settlement Verified",
            "message": "Accounts Officer Vikram Rao verified your bank settlement for Tuition Fee.",
            "type": "status_change",
            "is_read": 0,
            "created_at": (now - timedelta(hours=3)).isoformat() + "Z"
        },
        {
            "id": "notif-03",
            "student_id": "std-alex-01",
            "ticket_id": "tkt-007",
            "ticket_number": "CP-2026-0007",
            "title": "Medical Condonation Ticket Received",
            "message": "Your medical leave submission was logged and routed to Attendance Department.",
            "type": "ticket_created",
            "is_read": 0,
            "created_at": (now - timedelta(hours=18)).isoformat() + "Z"
        },
        {
            "id": "notif-04",
            "student_id": "std-priya-02",
            "ticket_id": "tkt-003",
            "ticket_number": "CP-2026-0003",
            "title": "Bonafide Certificate Ready",
            "message": "Prof. Ramesh Kumar signed and released your Bonafide Certificate #REG/2026/0891.",
            "type": "status_change",
            "is_read": 1,
            "created_at": (now - timedelta(days=1)).isoformat() + "Z"
        },
        {
            "id": "notif-05",
            "student_id": "std-priya-02",
            "ticket_id": "tkt-004",
            "ticket_number": "CP-2026-0004",
            "title": "Exam Clash Review Pending",
            "message": "Your timetable clash report for EC302 & MA301 has been queued with Exam Cell.",
            "type": "ticket_created",
            "is_read": 0,
            "created_at": (now - timedelta(hours=14)).isoformat() + "Z"
        },
        {
            "id": "notif-06",
            "student_id": "std-marcus-03",
            "ticket_id": "tkt-005",
            "ticket_number": "CP-2026-0005",
            "title": "ID Card Ready for Pickup",
            "message": "Your replacement campus ID has been printed. Collect at Window 4.",
            "type": "status_change",
            "is_read": 0,
            "created_at": (now - timedelta(hours=5)).isoformat() + "Z"
        }
    ]

    for nf in notifications:
        cursor.execute("""
            INSERT INTO notifications (id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (nf["id"], nf["student_id"], nf["ticket_id"], nf["ticket_number"], nf["title"], nf["message"], nf["type"], nf["is_read"], nf["created_at"]))

    conn.commit()
    conn.close()
    print("Database successfully seeded with 3 students, 8 tickets, staff notes, and notifications.")

if __name__ == "__main__":
    seed_database()
