const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env.e2e.test'),
    override: true,
});

const child = spawn(
    'npx',
    [
        'ts-node-dev',
        '--files',
        '--project',
        './tsconfig.json',
        '-r',
        'tsconfig-paths/register',
        'src/main.ts',
    ],
    {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        stdio: 'inherit',
    }
);

child.on('exit', (code) => process.exit(code ?? 0));
