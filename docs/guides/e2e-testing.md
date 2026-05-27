# E2E Testing Guide

End-to-end browser tests for the React frontend using Playwright (`@playwright/test`). Tests live at the repo root so they stay separate from Vitest unit tests and from the backend's Playwright scraping library.

---

## Prerequisites

- Node.js 22
- Root and frontend dependencies installed:

```bash
npm ci
cd frontend && npm ci && cd ..
```

- Playwright browsers (first time only):

```bash
# Local — Chromium and Firefox only (WebKit runs in CI)
npx playwright install chromium firefox
```

```bash
# CI / Linux — all three browsers plus system dependencies
npx playwright install --with-deps chromium firefox webkit
```

---

## Browsers: local vs CI

| Environment | Projects | Why |
|---|---|---|
| Local (`npm run test:e2e`) | Chromium, Firefox | WebKit is skipped — Playwright does not support WebKit on older macOS versions (e.g. macOS 13) |
| CI (`CI=true`) | Chromium, Firefox, WebKit | Ubuntu runners install all three via `--with-deps` |

To run a single browser locally:

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
```

To opt into WebKit locally on a supported OS, set `CI=true`:

```bash
CI=true npm run test:e2e -- --project=webkit
```

---

## Running tests

From the repo root:

```bash
npm run test:e2e              # Chromium + Firefox locally; all three in CI
npm run test:e2e:ui           # interactive UI mode
npm run test:e2e:headed       # visible browser window
npm run test:e2e:debug        # step-through debugger
npm run test:e2e:report       # open last HTML report
```

Run a single browser project:

```bash
npm run test:e2e -- --project=chromium
```

Playwright starts the Vite dev server automatically (`npm run dev` in `frontend/`), waits for `http://localhost:5173`, runs tests, then shuts the server down.

### Auth tests (full stack)

Tests in `auth/` require the **backend and MongoDB** running on port `1000` / `27017`:

```bash
docker compose -f docker-compose.dev.yml up backend mongo
```

Or start the full dev stack with `npm run start:dev`.

Auth tests self-register a unique user via `POST /api/auth/register` before each test. If the backend is unavailable, the auth suite is skipped automatically.

```bash
npm run test:e2e -- tests/e2e/spec/auth
```

### Shell UI (sidebar, top bar, avatar, theme)

These are **not** covered by E2E. They are validated by frontend unit tests:

- `frontend/src/components/layout/sidebar/Sidebar.test.tsx` — nav links, active route
- `frontend/src/components/layout/topBar/TobBar.test.tsx` — sidebar toggle
- Avatar and theme toggle — covered alongside layout components in unit tests

E2E focuses on cross-page auth and session flows; shell behavior is cheaper and more reliable to test in Vitest.

---

## Directory layout

```txt
tests/e2e/
  spec/
    auth/         # login, logout, session, protected routes
    smoke/        # startup and critical-path health checks
  fixtures/       # extended test fixtures (e.g. loginPage, testUser)
  helpers/        # E2E-only utilities (API setup)
  pages/          # Page Object Models
playwright.config.ts
```

| Layer | Purpose |
|---|---|
| `smoke/` | Fast checks that the app loads — no backend dependency |
| `auth/` | Full auth flows that require backend + database |
| `pages/` | Encapsulate locators and navigation for a screen |
| `fixtures/` | Shared Playwright test extensions |
| `helpers/` | Test-only helpers not tied to a single page |

---

## Conventions

### Selectors

Prefer accessible locators:

```ts
page.getByRole('heading', { name: 'Login' })
page.getByLabel('Email')
page.getByText('Sign in to your account.')
```

Avoid fragile CSS chains, `nth-child`, and deep DOM selectors.

### Stability

- Use Playwright auto-waiting and `await expect(locator).toBeVisible()`
- Do not use `waitForTimeout()`
- Smoke tests should not depend on external APIs when avoidable (e.g. test `/login` instead of `/`, which triggers token refresh)

### Routes

Import route paths from the frontend config module directly — not the full app config barrel (which pulls in Vite env):

```ts
import routes from '../../../frontend/src/config/routes.config';
```

### Page Objects and fixtures

```ts
import { expect, test } from '../fixtures/base';

test('login page loads', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
});
```

---

## Separation from other test tooling

| Tool | Location | Purpose |
|---|---|---|
| Vitest | `frontend/`, `backend/` | Unit and integration tests |
| Playwright (scraping) | `backend/` (`playwright` package) | Job portal browser automation |
| Playwright Test | repo root (`@playwright/test`) | Frontend E2E browser tests |

Do not reuse backend Playwright config or browser install paths for E2E.

---

## CI

E2E runs on pushes to `main` via [`.github/workflows/reusable-e2e-tests.yml`](../../.github/workflows/reusable-e2e-tests.yml), called from [`main-deploy.yml`](../../.github/workflows/main-deploy.yml) before production deploy.

The workflow:

1. Installs root and frontend dependencies
2. Installs browsers with `--with-deps`
3. Runs `npm run test:e2e` with `CI=true` (retries enabled, GitHub reporter)
4. Uploads HTML report and test artifacts on failure

Push and PR workflows intentionally skip E2E for speed — see [`docs/requirements/ci-cd.md`](../requirements/ci-cd.md).

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `No tests found` | Run from repo root, not `frontend/` |
| Dev server port in use | Stop other Vite instances on `5173`, or set `reuseExistingServer` locally (default when `CI` is unset) |
| WebKit skipped locally | Expected — WebKit runs in CI only. Use Chromium or Firefox locally |
| Frontend module not found | Run `npm ci` in `frontend/` |
