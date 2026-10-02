#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
pid_path="$project_root/scripts/.server.pid"
log_path="$project_root/scripts/.server.log"

cd "$project_root/frontend"
npm ci
npm run build

cd "$project_root/backend"
uv sync
nohup .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > "$log_path" 2>&1 &
echo $! > "$pid_path"
echo "Project Management MVP is running at http://127.0.0.1:8000"
