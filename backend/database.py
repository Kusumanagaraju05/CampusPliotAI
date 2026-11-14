import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "campus_pilot.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'student',
        student_id_code TEXT NOT NULL,
        department TEXT NOT NULL,
        year TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT NOT NULL UNIQUE,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        assigned_agent TEXT NOT NULL,
        department TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'Pending',
        action_plan TEXT NOT NULL,
        missing_info TEXT,
        requires_human_approval INTEGER NOT NULL DEFAULT 1,
        source_query TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)

    # Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        ticket_id TEXT,
        ticket_number TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)

    # Staff Notes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS staff_notes (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
    """)

    # Workflow Audit Log table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflow_logs (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON tickets(student_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_staff_notes_ticket ON staff_notes(ticket_id)")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
