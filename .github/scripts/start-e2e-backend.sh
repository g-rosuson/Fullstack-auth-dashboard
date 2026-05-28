#!/usr/bin/env bash
# Start the E2E backend (compiled prod entrypoint) and block until /api/docs/openapi responds.
# Expects `npm run build` to have already run in backend/. Uses nohup + disown so the
# process survives this step and keeps running for Playwright.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="${ROOT_DIR}/backend-e2e.log"
PID_FILE="${ROOT_DIR}/backend-e2e.pid"
HEALTH_URL="http://127.0.0.1:1000/api/docs/openapi"
MAX_ATTEMPTS=60
SLEEP_SECONDS=2

: > "${LOG_FILE}"

cd "${ROOT_DIR}/backend"

if [[ ! -f dist/src/main.js ]]; then
    echo "Missing backend/dist/src/main.js — run npm run build in backend/ first"
    exit 1
fi

nohup npm run start:e2e:built >> "${LOG_FILE}" 2>&1 &
echo $! > "${PID_FILE}"
disown

echo "Backend starting (pid $(cat "${PID_FILE}")), log: ${LOG_FILE}"

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
    if curl -sf --connect-timeout 2 --max-time 5 "${HEALTH_URL}" > /dev/null; then
        echo "Backend ready (attempt ${attempt}/${MAX_ATTEMPTS})"
        exit 0
    fi
    sleep "${SLEEP_SECONDS}"
done

echo "Backend did not become ready within $((MAX_ATTEMPTS * SLEEP_SECONDS))s"

pid="$(cat "${PID_FILE}")"
if kill -0 "${pid}" 2>/dev/null; then
    echo "Backend process (pid ${pid}) is still running"
else
    echo "Backend process (pid ${pid}) has exited"
fi

echo "--- curl diagnostic ---"
curl -sv --connect-timeout 2 --max-time 5 "${HEALTH_URL}" || true
echo "--- port check ---"
if command -v nc >/dev/null 2>&1; then
    nc -zv 127.0.0.1 1000 || true
fi
echo "--- last 100 lines of ${LOG_FILE} ---"
tail -100 "${LOG_FILE}" || true
exit 1
