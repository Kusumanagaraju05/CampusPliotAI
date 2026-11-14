"""
CampusPilot AI - Python Supabase Cloud Migration Runner
Allows applying /supabase/migrations/001_initial_schema.sql directly using Python.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env from backend/.env and .env
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
load_dotenv(project_root / "backend" / ".env")
load_dotenv(project_root / ".env")

migration_file = current_dir / "migrations" / "001_initial_schema.sql"

def main():
    print("=" * 70)
    print("  CAMPUSPILOT AI - SUPABASE CLOUD PYTHON MIGRATION RUNNER")
    print("=" * 70)

    if not migration_file.exists():
        print(f"[Error] Migration file not found: {migration_file}")
        sys.exit(1)

    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"[File] Loaded {migration_file.name} ({(len(sql_content) / 1024):.1f} KB)")

    db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if db_url:
        print("\n[Strategy] Connecting via PostgreSQL Database URL...")
        try:
            import psycopg2
            conn = psycopg2.connect(db_url, sslmode="require")
            cursor = conn.cursor()
            print(" -> Connected. Executing 001_initial_schema.sql...")
            cursor.execute(sql_content)
            conn.commit()
            print(" -> Migration applied successfully!")
            cursor.close()
            conn.close()
            return
        except ImportError:
            print(" -> Note: psycopg2 is not installed. To run via python: pip install psycopg2-binary")
        except Exception as e:
            print(f" -> PostgreSQL execution failed: {e}")

    print("\n" + "=" * 70)
    print("  SUPABASE CLOUD POSTGRESQL MIGRATION READY")
    print("=" * 70)
    print(f"Migration file located at:\n  {migration_file}")
    print("\nTo apply via Node.js runner:")
    print("  npm run db:migrate")
    print("\nTo apply via Supabase Dashboard SQL Editor:")
    print("  1. Open https://supabase.com/dashboard")
    print("  2. Select your project -> SQL Editor -> New Query")
    print("  3. Paste 001_initial_schema.sql and click RUN")
    print("=" * 70)

if __name__ == "__main__":
    main()
