#!/usr/bin/env bash
# Stop the E2E backend started by start-e2e-backend.sh.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="${ROOT_DIR}/backend-e2e.pid"

if [[ ! -f "${PID_FILE}" ]]; then
    exit 0
fi

pid="$(cat "${PID_FILE}")"
if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
    # ts-node-dev spawns a child; stop the process group if still listening.
    if lsof -ti:1000 >/dev/null 2>&1; then
        lsof -ti:1000 | xargs kill -9 2>/dev/null || true
    fi
fi

rm -f "${PID_FILE}"
