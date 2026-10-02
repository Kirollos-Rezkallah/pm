# Database approach

The MVP uses a local SQLite file at `backend/data/kanban.db`. FastAPI creates the directory, database, and tables automatically.

## Tables

`users` keeps a future-safe account identity:

| Column | Purpose |
|---|---|
| `id` | SQLite primary key |
| `username` | Unique username; the MVP creates only `user` |

`boards` keeps one board per user:

| Column | Purpose |
|---|---|
| `user_id` | Primary key and foreign key to `users.id` |
| `data_json` | Complete validated board JSON |
| `updated_at` | Last successful replacement time |

The JSON document has `columns` and `cards`. There are always five unique columns, every card key matches its ID, and every card appears in exactly one column's `cardIds`. FastAPI validates these rules before writing.

## Lifecycle

On the first successful login, the backend creates the user. The first board read seeds the inherited five-column example. Every create, edit, rename, or move replaces the validated document atomically for that user.

This model intentionally favors the one-board MVP. If boards, membership, card queries, or activity reporting become first-class requirements, migrate the JSON document into normalized `boards`, `columns`, and `cards` tables with an explicit migration script; do not mix partial relational state with the JSON source of truth.
