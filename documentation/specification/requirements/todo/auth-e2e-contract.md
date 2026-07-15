# TODO

# Auth — end-to-end test requirements

**Canonical source** for browser-level auth test cases. Playwright specs in [`tests/e2e/spec/auth/`](../../tests/e2e/spec/auth/) MUST implement scenarios listed here.

**Scope:** Login, logout, registration (feature-flagged), protected routes, and session bootstrap via the React app with a live backend and MongoDB.

**HTTP rules** live in [auth-http-contract.md](./auth-http-contract.md) (`AUTH-*`). This document defines UI setup, steps, and assertions only — link to the contract by ID, do not restate API rules here.

**Related documents:**

| Document | Use when |
|----------|----------|
| [auth-http-contract.md](./auth-http-contract.md) | API rules (`AUTH-*`) |
| [jobs-e2e-contract.md](./jobs-e2e-contract.md) | Jobs page cases that assume auth (`AUTH-E2E-022`) |
| [e2e-testing.md](../guides/e2e-testing.md) | Playwright setup and conventions |

Smoke tests (`SMK-*`) are frontend-only and live in [`tests/e2e/spec/smoke/`](../../tests/e2e/spec/smoke/) — not duplicated here.

---

## Requirement IDs

| Prefix | Verified by |
|--------|-------------|
| **`AUTH-E2E-*`** | `tests/e2e/spec/auth/*.e2e.test.ts` |
| **`AUTH-*`** | `backend/test/integration/auth-integration.test.ts` |
| **`SMK-*`** | `tests/e2e/spec/smoke/*.e2e.test.ts` (Tier A — no backend) |

E2E complements integration: integration asserts HTTP; E2E asserts the UI calls those APIs and reflects results to the user. See [cross-reference](#cross-reference).

---

## Environment and execution

**Tier B — full stack.** Vite `:5173`, backend `:1000`, MongoDB `:27017`.

```bash
docker compose -f docker-compose.e2e.yml up -d mongo --wait
cd backend && npm run start:e2e
npm run test:e2e -- tests/e2e/spec/auth
```

**CI:** Backend must be up — auth failures block deploy (see [e2e-testing.md](../guides/e2e-testing.md)). Locally, if the backend is unavailable, the suite **fails** (does not skip).

**Backend:** [`backend/.env.e2e.test`](../../backend/.env.e2e.test) via `npm run start:e2e` (local) or `npm run build && npm run start:e2e:built` (CI/prod parity). See [Backend bootstrap](../guides/e2e-testing.md#backend-bootstrap).

**Fixtures:**

- `loginPage` — [`tests/e2e/pages/login.page.ts`](../../tests/e2e/pages/login.page.ts) ([`fixtures/base.ts`](../../tests/e2e/fixtures/base.ts))
- `testUser` — unique user seeded via `POST /api/auth/register` before each test ([`fixtures/authenticated.ts`](../../tests/e2e/fixtures/authenticated.ts))

**Naming:** `*.e2e.test.ts`; titles prefixed `[AUTH-E2E-xxx]`. Prefer `getByRole` / `getByLabel`; no `waitForTimeout()`.

**Note (006):** Use client-side `history.pushState` + `popstate` to visit `/login` while authenticated — full `page.goto('/login')` resets in-memory session (Zustand).

---

## Application UI reference

| Route | Page / component |
|-------|------------------|
| `/login` | [`Authentication`](../../frontend/src/components/pages/authentication/Authentication.tsx) |
| `/register` | Same (when `registrationEnabled`) |
| `/` | Home — heading **Home** (level 1) |
| `/jobs` | Jobs — heading **Jobs** (level 1); see [jobs-e2e-contract.md](./jobs-e2e-contract.md) |

**Login page** ([`LoginPage`](../../tests/e2e/pages/login.page.ts)):

| Control | Label / role |
|---------|--------------|
| Heading | **Login** (level 1) |
| Form | **Authentication form** (`role="form"`) |
| Email | **Email** |
| Password | **Password** |
| Submit | **Login** (button) |

**Logout** ([`DashboardPage`](../../tests/e2e/pages/dashboard.page.ts)): user menu **Dropdown menu trigger** → menu item **Logout**.

API routes invoked by auth flows: see [auth-http-contract.md](./auth-http-contract.md) § Canonical routes.

---

## Cross-reference

Maps each E2E case to related HTTP rule(s). Full rule text: [auth-http-contract.md](./auth-http-contract.md).

| E2E ID | HTTP ID(s) |
|--------|------------|
| AUTH-E2E-001 | AUTH-LOG-001, AUTH-TOK-001, AUTH-TOK-002, AUTH-TOK-003 |
| AUTH-E2E-002 | AUTH-LOG-002 |
| AUTH-E2E-003 | AUTH-LOG-002 |
| AUTH-E2E-004 | AUTH-OUT-002, AUTH-OUT-003 |
| AUTH-E2E-005 | — |
| AUTH-E2E-006 | — |
| AUTH-E2E-010 | — |
| AUTH-E2E-020 | AUTH-REF-002 |
| AUTH-E2E-021 | AUTH-REF-001 |
| AUTH-E2E-022 | AUTH-LOG-001, AUTH-REF-001 |
| AUTH-E2E-023 | AUTH-REF-002 |

**Integration only** (no E2E planned): `AUTH-REG-001`, `AUTH-REG-002`, `AUTH-REG-010`, `AUTH-OUT-001`, `AUTH-REF-003`, full token/cookie attribute matrix.

---

## Test cases

### Login and logout

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **AUTH-E2E-001** | P0 | Successful login | `testUser` registered via API | `/login` → fill email/password → **Login** | URL `/`; **Home** heading visible |
| **AUTH-E2E-002** | P1 | Wrong password | `testUser` exists | Login with wrong password | Stays on `/login`; **Login** heading visible |
| **AUTH-E2E-003** | P1 | Unknown email | None | Login with unknown email | Stays on `/login`; **Login** heading visible |
| **AUTH-E2E-004** | P0 | Logout | Logged in via UI | User menu → **Logout** | URL `/login`; **Login** heading visible |
| **AUTH-E2E-005** | P1 | Empty form | None | `/login` → submit without fields | Stays on `/login`; **Login** heading visible |
| **AUTH-E2E-006** | P0 | Authenticated user on login route | Logged in via UI | Client-side navigate to `/login` (not full reload) | Redirect to `/`; **Home** heading visible |

### Registration

Requires `features.registrationEnabled === true` in [`features.config.ts`](../../frontend/src/config/features.config.ts). **Skipped in current product config.**

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **AUTH-E2E-010** | P2 | Register form renders | Registration enabled | Navigate to `/register` | **Register** heading; **First name** field visible |

### Protected routes and session

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **AUTH-E2E-020** | P0 | Protected route without session | No login; fresh context | `page.goto('/jobs')` | Redirect to `/login`; **Login** heading visible |
| **AUTH-E2E-021** | P0 | Session bootstrap after reload | Logged in via UI | `page.reload()` | URL `/`; **Home** heading visible (refresh cookie sent) |
| **AUTH-E2E-022** | P1 | Authenticated user reaches jobs | Logged in via UI | `page.goto('/jobs')` | URL `/jobs`; **Jobs** heading (level 1) visible |
| **AUTH-E2E-023** | P1 | Cleared cookies end session | Logged in via UI | Clear cookies → reload | Redirect to `/login`; **Login** heading visible |

---

## Priority summary

| Priority | IDs |
|----------|-----|
| **P0** | 001, 004, 006, 020, 021 |
| **P1** | 002, 003, 005, 022, 023 |
| **P2** | 010 (feature-flagged) |

**Total: 11 test cases** (10 active when registration disabled).

---

## Traceability

| E2E ID | Scenario | Status |
|--------|----------|--------|
| AUTH-E2E-001 | Successful login | Implemented |
| AUTH-E2E-002 | Wrong password | Implemented |
| AUTH-E2E-003 | Unknown email | Implemented |
| AUTH-E2E-004 | Logout | Implemented |
| AUTH-E2E-005 | Empty login form | Implemented |
| AUTH-E2E-006 | Authenticated on login redirects home | Implemented |
| AUTH-E2E-010 | Register form renders | Implemented — skipped when registration disabled |
| AUTH-E2E-020 | Protected route redirect | Implemented |
| AUTH-E2E-021 | Session bootstrap via reload | Implemented |
| AUTH-E2E-022 | Reach jobs when authenticated | Implemented |
| AUTH-E2E-023 | Cleared cookies → login | Implemented |

Mark **Implemented** when `[AUTH-E2E-xxx]` exists in spec and passes in CI.

---

## Change control

- **UI-only changes** preserving behavior: no ID change.
- **New E2E case:** assign next `AUTH-E2E-*`; add rows to [cross-reference](#cross-reference) and [traceability](#traceability).
- **HTTP contract changes:** update [auth-http-contract.md](./auth-http-contract.md) first, then cross-ref here.
