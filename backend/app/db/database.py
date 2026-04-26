from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlparse

from app.config import settings

BASE_DIR = Path(__file__).resolve().parents[2]
SCHEMA_PATH = BASE_DIR / "schema.sql"


def _resolve_sqlite_path(database_url: str) -> Path:
    if not database_url.startswith("sqlite:///"):
        raise ValueError("Only sqlite:/// DATABASE_URL values are currently supported.")

    raw_path = database_url.removeprefix("sqlite:///")
    parsed = urlparse(database_url)

    # Preserve SQLAlchemy-style relative SQLite paths like sqlite:///./prompt_engine.db.
    if raw_path.startswith("./") or raw_path.startswith("../"):
        path = Path(raw_path)
    else:
        path = Path(parsed.path or raw_path)

    if path.is_absolute():
        return path

    return (BASE_DIR / path).resolve()


DB_PATH = _resolve_sqlite_path(settings.database_url)


def _initialize_schema(conn: sqlite3.Connection) -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn.executescript(schema_sql)
    conn.commit()


@contextmanager
def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        _initialize_schema(conn)
        yield conn
    finally:
        conn.close()


def save_interaction(raw_input: str, normalized_text: str, intent: dict, final_prompt: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO interactions(raw_input, normalized_text, intent, final_prompt)
            VALUES (?, ?, ?, ?)
            """,
            (raw_input, normalized_text, json.dumps(intent), final_prompt),
        )
        conn.commit()


def upsert_memory(task: str, domain: str) -> None:
    with get_conn() as conn:
        existing = conn.execute(
            "SELECT id, usage_count FROM memory WHERE task = ? AND domain = ?",
            (task, domain),
        ).fetchone()

        if existing:
            conn.execute(
                "UPDATE memory SET usage_count = ? WHERE id = ?",
                (existing["usage_count"] + 1, existing["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO memory(task, domain, usage_count) VALUES (?, ?, ?)",
                (task, domain, 1),
            )
        conn.commit()


def list_interactions(limit: int = 50) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, raw_input, normalized_text, intent, final_prompt, created_at
            FROM interactions
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
