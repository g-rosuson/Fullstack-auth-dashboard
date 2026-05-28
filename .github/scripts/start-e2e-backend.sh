#!/usr/bin/env bash
# Start the E2E backend (compiled prod entrypoint) and block until /api/docs/openapi responds.
# Expects `npm run build` to have already run in backend/. Uses nohup + disown so the
# process survives this step and keeps running for Playwright.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="${ROOT_DIR}/backend-e2e.log"
PID_FILE="${ROOT_DIR}/backend-e2e.pid"
E2E_ENV_FILE="${ROOT_DIR}/backend/.env.e2e.test"
E2E_PORT="3000"
if [[ -f "${E2E_ENV_FILE}" ]]; then
    E2E_PORT="$(grep -E '^PORT=' "${E2E_ENV_FILE}" | tail -1 | cut -d= -f2 | tr -d '\r' || true)"
fi
E2E_PORT="${E2E_PORT:-3000}"
HEALTH_URL="http://127.0.0.1:${E2E_PORT}/api/docs/openapi"
MAX_ATTEMPTS=60
SLEEP_SECONDS=2

# BEGIN E2E-DEBUG — remove after CI root-cause is fixed
e2e_debug() {
    local label="${1:-snapshot}"
    echo "[E2E-DEBUG] ========== ${label} =========="

    echo "[E2E-DEBUG] timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "[E2E-DEBUG] E2E port: ${E2E_PORT}"
    echo "[E2E-DEBUG] health URL: ${HEALTH_URL}"

    if [[ -f "${PID_FILE}" ]]; then
        local saved_pid
        saved_pid="$(cat "${PID_FILE}")"
        echo "[E2E-DEBUG] saved PID (from start script): ${saved_pid}"
        if kill -0 "${saved_pid}" 2>/dev/null; then
            echo "[E2E-DEBUG] saved PID is alive"
            ps -o pid,ppid,pgid,sid,stat,etime,cmd -p "${saved_pid}" 2>/dev/null || true
        else
            echo "[E2E-DEBUG] saved PID is NOT alive"
        fi
    else
        echo "[E2E-DEBUG] no PID file at ${PID_FILE}"
    fi

    echo "[E2E-DEBUG] node/npm processes:"
    ps -eo pid,ppid,pgid,stat,etime,cmd | grep -E '[n]ode|[n]pm' || echo "[E2E-DEBUG] (none matched)"

    echo "[E2E-DEBUG] compiled listen line in dist/src/main.js:"
    grep -n 'listen' "${ROOT_DIR}/backend/dist/src/main.js" 2>/dev/null || echo "[E2E-DEBUG] (grep failed)"

    echo "[E2E-DEBUG] listeners on port ${E2E_PORT} (lsof):"
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"${E2E_PORT}" -sTCP:LISTEN 2>/dev/null || echo "[E2E-DEBUG] (no listeners / lsof error)"
    else
        echo "[E2E-DEBUG] lsof not available"
    fi

    echo "[E2E-DEBUG] listeners on port ${E2E_PORT} (ss):"
    if command -v ss >/dev/null 2>&1; then
        ss -ltnp "sport = :${E2E_PORT}" 2>/dev/null || true
    else
        echo "[E2E-DEBUG] ss not available"
    fi

    local url curl_output curl_exit
    for url in \
        "http://127.0.0.1:${E2E_PORT}/api/docs/openapi" \
        "http://localhost:${E2E_PORT}/api/docs/openapi" \
        "http://[::1]:${E2E_PORT}/api/docs/openapi"; do
        echo "[E2E-DEBUG] curl ${url}"
        curl_output="$(curl -s --connect-timeout 2 --max-time 5 -o /dev/null -w 'http_code=%{http_code} time=%{time_total}s' "${url}" 2>&1)" || curl_exit=$?
        echo "[E2E-DEBUG]   ${curl_output:-failed} shell_exit=${curl_exit:-0}"
        curl_exit=""
    done

    echo "[E2E-DEBUG] curl -sv ${HEALTH_URL} (verbose):"
    curl -sv --connect-timeout 2 --max-time 5 "${HEALTH_URL}" 2>&1 | head -30 || true

    echo "[E2E-DEBUG] nc probes:"
    if command -v nc >/dev/null 2>&1; then
        nc -zv 127.0.0.1 "${E2E_PORT}" 2>&1 || true
        nc -zv localhost "${E2E_PORT}" 2>&1 || true
        nc -zv ::1 "${E2E_PORT}" 2>&1 || true
    else
        echo "[E2E-DEBUG] nc not available"
    fi

    echo "[E2E-DEBUG] last 20 lines of backend log:"
    tail -20 "${LOG_FILE}" 2>/dev/null || echo "[E2E-DEBUG] (log empty or missing)"

    echo "[E2E-DEBUG] ========== end ${label} =========="
}

should_e2e_debug_on_attempt() {
    local attempt="$1"
    [[ "${attempt}" -eq 1 || "${attempt}" -eq 3 || "${attempt}" -eq 10 || "${attempt}" -eq 30 ]]
}
# END E2E-DEBUG

: > "${LOG_FILE}"

cd "${ROOT_DIR}/backend"

if [[ ! -f dist/src/main.js ]]; then
    echo "Missing backend/dist/src/main.js — run npm run build in backend/ first"
    exit 1
fi

nohup npm run start:e2e:built >> "${LOG_FILE}" 2>&1 &
echo $! > "${PID_FILE}"
disown

echo "Backend starting (pid $(cat "${PID_FILE}")), port ${E2E_PORT}, log: ${LOG_FILE}"

# BEGIN E2E-DEBUG
sleep 1
e2e_debug "1s-after-spawn"
# END E2E-DEBUG

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
    if curl -sf --connect-timeout 2 --max-time 5 "${HEALTH_URL}" > /dev/null; then
        echo "Backend ready (attempt ${attempt}/${MAX_ATTEMPTS})"
        exit 0
    fi

    # BEGIN E2E-DEBUG
    if should_e2e_debug_on_attempt "${attempt}"; then
        e2e_debug "health-check-attempt-${attempt}"
    fi
    # END E2E-DEBUG

    sleep "${SLEEP_SECONDS}"
done

echo "Backend did not become ready within $((MAX_ATTEMPTS * SLEEP_SECONDS))s"

pid="$(cat "${PID_FILE}")"
if kill -0 "${pid}" 2>/dev/null; then
    echo "Backend process (pid ${pid}) is still running"
else
    echo "Backend process (pid ${pid}) has exited"
fi

# BEGIN E2E-DEBUG
e2e_debug "final-failure"
# END E2E-DEBUG

echo "--- last 100 lines of ${LOG_FILE} ---"
tail -100 "${LOG_FILE}" || true
exit 1
