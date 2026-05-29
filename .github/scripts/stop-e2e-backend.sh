#!/usr/bin/env bash
# Stop the E2E backend started by start-e2e-backend.sh.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="${ROOT_DIR}/backend-e2e.pid"
E2E_ENV_FILE="${ROOT_DIR}/backend/.env.e2e.test"

# Must match start-e2e-backend.sh / backend/.env.e2e.test PORT.
E2E_PORT="3000"
if [[ -f "${E2E_ENV_FILE}" ]]; then
    E2E_PORT="$(grep -E '^PORT=' "${E2E_ENV_FILE}" | cut -d= -f2 | tr -d '\r' || true)"
    E2E_PORT="${E2E_PORT:-3000}"
fi

if [[ ! -f "${PID_FILE}" ]]; then
    exit 0
fi

pid="$(cat "${PID_FILE}")"
if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
    # npm/node may spawn children; stop anything still listening on the E2E port.
    if lsof -ti:"${E2E_PORT}" >/dev/null 2>&1; then
        lsof -ti:"${E2E_PORT}" | xargs kill -9 2>/dev/null || true
    fi
fi

rm -f "${PID_FILE}"
