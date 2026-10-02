# Backend guidance

This folder contains the `uv`-managed FastAPI server for the local MVP.

- `app/main.py` owns FastAPI routes and static frontend serving.
- `app/database.py` owns SQLite setup and board persistence.
- `app/models.py` validates API and stored board data.
- `app/openrouter.py` owns server-side OpenRouter requests; never expose `OPENROUTER_API_KEY` to the frontend or logs.
- Tests use a temporary SQLite database and mocked OpenRouter transport. Run them with `uv run pytest` from this folder.

Keep `/api/*` authenticated except health and login. The static frontend mount belongs after every API route.
