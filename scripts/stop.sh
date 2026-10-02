#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
pid_path="$project_root/scripts/.server.pid"

if [ ! -f "$pid_path" ]; then
  echo "No server PID file was found."
  exit 0
fi

kill "$(cat "$pid_path")" 2>/dev/null || true
rm -f "$pid_path"
echo "Project Management MVP stopped."
