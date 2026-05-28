#!/usr/bin/env bash
# Start the E2E backend and block until /api/docs/openapi responds.
# Uses nohup + disown so the process survives this step and keeps running for Playwright.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="${ROOT_DIR}/backend-e2e.log"
PID_FILE="${ROOT_DIR}/backend-e2e.pid"
HEALTH_URL="http://localhost:1000/api/docs/openapi"
MAX_ATTEMPTS=60
SLEEP_SECONDS=2

: > "${LOG_FILE}"

cd "${ROOT_DIR}/backend"
nohup npm run start:e2e >> "${LOG_FILE}" 2>&1 &
echo $! > "${PID_FILE}"
disown

echo "Backend starting (pid $(cat "${PID_FILE}")), log: ${LOG_FILE}"

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
    if curl -sf "${HEALTH_URL}" > /dev/null; then
        echo "Backend ready (attempt ${attempt}/${MAX_ATTEMPTS})"
        exit 0
    fi
    sleep "${SLEEP_SECONDS}"
done

echo "Backend did not become ready within $((MAX_ATTEMPTS * SLEEP_SECONDS))s"
echo "--- ${LOG_FILE} ---"
cat "${LOG_FILE}" || true
exit 1
