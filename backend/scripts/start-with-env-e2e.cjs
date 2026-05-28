/**
 * Local E2E backend launcher (`npm run start:e2e`).
 *
 * Loads `backend/.env.e2e.test` and starts the API with ts-node-dev (same dev
 * toolchain as `npm start`). Use this for local Playwright runs — no build step,
 * file watching enabled.
 *
 * CI uses `start-with-env-e2e-built.cjs` via `npm run start:e2e:built` instead,
 * which runs the compiled prod entrypoint (`node dist/src/main.js`).
 *
 * @see docs/guides/e2e-testing.md
 */
const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env.e2e.test'),
    override: true,
});

const child = spawn(
    'npx',
    ['ts-node-dev', '--files', '--project', './tsconfig.json', '-r', 'tsconfig-paths/register', 'src/main.ts'],
    {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        stdio: 'inherit',
    }
);

child.on('exit', code => process.exit(code ?? 0));
