import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const e2eBackendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

export default defineConfig({
    testDir: './tests/e2e/spec',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 2 : undefined,
    reporter: isCI
        ? [
              ['github'],
              ['html', { open: 'never' }],
          ]
        : [
              ['list'],
              ['html', { open: 'never' }],
          ],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev',
        cwd: './frontend',
        url: 'http://localhost:5173',
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: {
            VITE_BACKEND_URL: e2eBackendUrl,
            VITE_FRONTEND_URL: 'http://localhost:5173',
        },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        // WebKit is CI-only: Playwright does not ship WebKit for older macOS (e.g. mac13).
        ...(isCI
            ? [
                  {
                      name: 'webkit',
                      use: { ...devices['Desktop Safari'] },
                  },
              ]
            : []),
    ],
});
