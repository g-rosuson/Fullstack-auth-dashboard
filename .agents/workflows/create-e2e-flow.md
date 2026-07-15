# Playwright E2E Setup Requirements

## Objective

Install and configure end-to-end (E2E) testing using Playwright for the React frontend application.

The setup must support:
- React + TypeScript + Vite
- npm
- Vitest coexistence
- monorepo structure
- CI-ready execution
- scalable E2E organization

---

# Existing Stack

## Frontend

- React
- TypeScript
- Vite
- Vitest
- npm

## Repository Structure

```txt
root/
  frontend/
  backend/
```

---

# Required Architecture

## Playwright Ownership

Playwright E2E testing must remain separate from:
- backend scraping Playwright usage
- Vitest unit/integration tests

Do NOT reuse backend Playwright configuration.

---

# Required Directory Structure

Create:

```txt
root/
  tests/
    e2e/
      spec/
        auth/
        smoke/
      fixtures/
      helpers/
      pages/
```

Create root-level configuration:

```txt
root/
  playwright.config.ts
```

Reasoning:
- keeps E2E concerns isolated
- avoids mixing frontend source with browser automation
- scales better for monorepos
- supports future multi-app testing

---

# Required Dependencies

Install:

```bash
npm install -D @playwright/test
```

Do NOT install:
- Cypress
- Selenium
- Puppeteer

unless explicitly requested.

---

# Browser Installation

Install Playwright browsers:

- Chromium
- Firefox
- WebKit

Include required system dependencies.

---

# Playwright Configuration Requirements

## Base Requirements

Configuration must:
- use TypeScript
- support local development
- support CI
- support parallel execution
- support retries in CI only
- collect traces on failure
- collect screenshots on failure
- collect video on failure

---

# Frontend Server Requirements

Playwright must automatically start the Vite frontend before tests run.

Expected behavior:
1. start frontend dev server
2. wait for app availability
3. execute tests
4. shut down cleanly

Use existing frontend npm scripts where possible.

---

# Test Runner Requirements

Must support:

```bash
npx playwright test
```

```bash
npx playwright test --ui
```

```bash
npx playwright test --headed
```

---

# Cross Browser Requirements

Configure projects for:
- Chromium
- Firefox
- WebKit

Desktop viewport only.

---

# Selector Requirements

Prefer accessible selectors:

```ts
getByRole()
getByLabel()
getByText()
```

Avoid:
- fragile CSS selectors
- nth-child selectors
- deep DOM selectors

---

# Example Test Requirements

Create at least one smoke test validating:
- frontend loads successfully
- homepage renders
- primary UI element is visible

The sample test must:
- be deterministic
- avoid external API dependencies
- avoid arbitrary timeouts

---

# Stability Requirements

Avoid:

```ts
waitForTimeout()
```

Prefer:

```ts
await expect(locator).toBeVisible()
```

Use Playwright auto-waiting behavior whenever possible.

---

# Package.json Scripts

Add root-level scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed"
}
```

Optional:

```json
{
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

---

# Deliverables

Required deliverables:
1. Playwright installed
2. Browser binaries installed
3. Working `playwright.config.ts`
4. E2E directory structure created
5. Example smoke test created
6. Root npm scripts added
7. CI-compatible configuration
8. README/setup instructions

---

# Validation Criteria

The setup is complete only if:

```bash
npm run test:e2e
```

successfully:
- launches the frontend
- runs Playwright tests
- passes at least one Chromium test
```