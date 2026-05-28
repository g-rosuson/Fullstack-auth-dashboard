#!/usr/bin/env bash
# Verify MongoDB is up before starting the E2E backend (matches backend/.env.e2e.test URI).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.dev.yml"
MONGO_URI="mongodb://127.0.0.1:27017/test?directConnection=true"

echo "--- docker compose ps mongo ---"
docker compose -f "${COMPOSE_FILE}" ps mongo

echo "--- mongosh ping (inside mongo container) ---"
docker compose -f "${COMPOSE_FILE}" exec -T mongo mongosh --quiet --eval "db.runCommand({ ping: 1 })"

echo "--- host reachability (${MONGO_URI}) ---"
if ! command -v mongosh >/dev/null 2>&1; then
    echo "mongosh not installed on runner; checking TCP port 27017"
    if command -v nc >/dev/null 2>&1; then
        nc -z 127.0.0.1 27017
    else
        bash -c "echo > /dev/tcp/127.0.0.1/27017"
    fi
    echo "127.0.0.1:27017 is reachable from host"
else
    mongosh "${MONGO_URI}" --quiet --eval "db.runCommand({ ping: 1 })"
    echo "MongoDB ping succeeded from host"
fi
