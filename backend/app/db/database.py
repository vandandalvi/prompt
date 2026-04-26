from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BASE_DIR / "prompt_engine.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
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
