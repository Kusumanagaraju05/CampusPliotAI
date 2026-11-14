"""
CampusPilot AI - Application Server Launcher
Runs the complete production web application (FastAPI backend + React frontend).
"""

import os
import sys
import uvicorn
from backend.database import init_db, DB_PATH
from backend.seed_data import seed_database

def main():
    print("=" * 65)
    print("  CAMPUSPILOT AI - YOUR CAMPUS. YOUR AI. YOUR PROBLEMS SOLVED.")
    print("  Autonomous Agentic College Student Support & Operations Platform")
    print("=" * 65)

    # Initialize and seed database if missing
    if not os.path.exists(DB_PATH):
        print("[Database] Initializing and seeding SQLite demo database...")
        seed_database()
    else:
        print("[Database] Connected to persistent database:", DB_PATH)

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")

    print(f"\n[Server] Starting CampusPilot AI at: http://{host}:{port}")
    print(f"[API Docs] Interactive Swagger UI at: http://{host}:{port}/docs")
    print(f"[System] Press Ctrl+C to stop the server.\n")

    uvicorn.run("backend.main:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    main()
