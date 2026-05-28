/**
 * CI / production-parity E2E backend launcher (`npm run start:e2e:built`).
 *
 * Loads `backend/.env.e2e.test` and runs `node dist/src/main.js` with
 * `NODE_PATH=dist/src` — same entrypoint as the prod Docker image. Requires
 * `npm run build` first (`.github/scripts/start-e2e-backend.sh` runs build
 * before invoking this script).
 *
 * For local dev without a build, use `start-with-env-e2e.cjs` (`npm run start:e2e`).
 *
 * @see docs/guides/e2e-testing.md
 */
const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env.e2e.test'),
    override: true,
});

const backendRoot = path.resolve(__dirname, '..');

// BEGIN E2E-DEBUG — remove after CI root-cause is fixed
console.error(`[E2E-DEBUG] wrapper pid=${process.pid} cwd=${backendRoot}`);
// END E2E-DEBUG

const child = spawn('node', ['dist/src/main.js'], {
    cwd: backendRoot,
    env: {
        ...process.env,
        NODE_PATH: path.join(backendRoot, 'dist/src'),
    },
    stdio: 'inherit',
});

// BEGIN E2E-DEBUG — remove after CI root-cause is fixed
console.error(`[E2E-DEBUG] spawned node child pid=${child.pid}`);
child.on('exit', (code, signal) => {
    console.error(`[E2E-DEBUG] node child exited code=${code} signal=${signal ?? 'none'}`);
    process.exit(code ?? 0);
});
// END E2E-DEBUG
