from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from app.models import Board


def default_board() -> Board:
    return Board.model_validate(
        {
            "columns": [
                {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
                {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
                {"id": "col-progress", "title": "In Progress", "cardIds": ["card-4", "card-5"]},
                {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
                {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
            ],
            "cards": {
                "card-1": {"id": "card-1", "title": "Align roadmap themes", "details": "Draft quarterly themes with impact statements and metrics."},
                "card-2": {"id": "card-2", "title": "Gather customer signals", "details": "Review support tags, sales notes, and churn feedback."},
                "card-3": {"id": "card-3", "title": "Prototype analytics view", "details": "Sketch initial dashboard layout and key drill-downs."},
                "card-4": {"id": "card-4", "title": "Refine status language", "details": "Standardize column labels and tone across the board."},
                "card-5": {"id": "card-5", "title": "Design card layout", "details": "Add hierarchy and spacing for scanning dense lists."},
                "card-6": {"id": "card-6", "title": "QA micro-interactions", "details": "Verify hover, focus, and loading states."},
                "card-7": {"id": "card-7", "title": "Ship marketing page", "details": "Final copy approved and asset pack delivered."},
                "card-8": {"id": "card-8", "title": "Close onboarding sprint", "details": "Document release notes and share internally."},
            },
        }
    )


class Database:
    def __init__(self, path: Path):
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS boards (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id),
                    data_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def get_or_create_user(self, username: str) -> int:
        self.initialize()
        with sqlite3.connect(self.path) as connection:
            connection.execute("INSERT OR IGNORE INTO users (username) VALUES (?)", (username,))
            row = connection.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        assert row is not None
        return int(row[0])

    def get_board(self, user_id: int) -> Board:
        self.initialize()
        with sqlite3.connect(self.path) as connection:
            row = connection.execute("SELECT data_json FROM boards WHERE user_id = ?", (user_id,)).fetchone()
            if row is None:
                board = default_board()
                self._save(connection, user_id, board)
                return board
        return Board.model_validate_json(row[0])

    def save_board(self, user_id: int, board: Board) -> Board:
        self.initialize()
        with sqlite3.connect(self.path) as connection:
            self._save(connection, user_id, board)
        return board

    @staticmethod
    def _save(connection: sqlite3.Connection, user_id: int, board: Board) -> None:
        connection.execute(
            """
            INSERT INTO boards (user_id, data_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, json.dumps(board.model_dump(), separators=(",", ":"))),
        )
