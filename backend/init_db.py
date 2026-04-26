from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "prompt_engine.db"
SCHEMA_PATH = ROOT / "schema.sql"


def init_db() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(schema_sql)
        conn.commit()
    print(f"Database initialized at: {DB_PATH}")


if __name__ == "__main__":
    init_db()
