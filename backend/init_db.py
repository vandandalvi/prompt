import sqlite3

from app.db.database import DB_PATH, SCHEMA_PATH


def init_db() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(schema_sql)
        conn.commit()
    print(f"Database initialized at: {DB_PATH}")


if __name__ == "__main__":
    init_db()
