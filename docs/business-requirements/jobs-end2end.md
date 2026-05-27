# Jobs — end-to-end test requirements

**Canonical source.** This document is the authoritative definition of browser-level jobs test cases. Playwright specs in [`tests/e2e/spec/jobs/`](../../tests/e2e/spec/jobs/) MUST implement scenarios listed here. Do not rely on planning notes or chat context — if behavior is not written here, it is not a requirement.

**Scope:** User-visible behavior on `/jobs` when the React app runs against a live backend and MongoDB.

> **Prerequisite — error UI not yet implemented.** Several cases in this document assert that API failures are shown to the user (duplicate name, validation errors, edit-while-running, etc.). The jobs page currently logs many failures to the console only ([`Jobs.tsx`](../../frontend/src/components/pages/jobs/Jobs.tsx)). **User-visible error handling MUST be added to the frontend before the affected E2E cases can be implemented.** Until then, skip or defer: **JOBS-E2E-013**, **033**, **060**, **061**, **062**, **072**, **074**, and **083**. See [Error UX policy](#error-ux-policy).

**Related documents (supporting only):**

| Document | Use when |
|----------|----------|
| [jobs-http-contract.md](../requirements/jobs-http-contract.md) | Full backend HTTP contract; integration test traceability |
| [auth-http-contract.md](../requirements/auth-http-contract.md) | Session and token rules |
| [e2e-testing.md](../guides/e2e-testing.md) | Playwright install, CI, selector conventions |

---

## Requirement IDs

| Prefix | Layer | Verified by |
|--------|-------|-------------|
| **`JOBS-E2E-*`** | Browser user journeys | `tests/e2e/spec/jobs/*.e2e.test.ts` |
| **`JOBS-*`** | HTTP API contract | `backend/test/integration/jobs-integration.test.ts` |
| **`AUTH-E2E-*`** | Auth routes and session | `tests/e2e/spec/auth/*.e2e.test.ts` |

E2E cases **complement** HTTP integration tests: integration proves API status codes and envelopes; E2E proves the **UI calls those APIs correctly** and reflects results to the user.

---

## Division of responsibility

| Concern | Layer | Why |
|---------|-------|-----|
| Empty list API response shape | `JOBS-LST-001` integration | Supertest asserts JSON |
| Empty list shown in browser | `JOBS-E2E-002` E2E | Proves `getAll` result renders as no cards |
| Create returns 201 | `JOBS-CRT-001` integration | HTTP assertion |
| User fills form and sees new card | `JOBS-E2E-011` E2E | Form → API → DOM → reload persistence |
| Duplicate name returns 409 | `JOBS-UNQ-002` integration | HTTP assertion |
| User sees error on duplicate submit | `JOBS-E2E-013` E2E | Error must be visible in UI |
| Cross-user 404 on GET | `JOBS-ISO-*` integration | Requires two users; not standard E2E |
| Pagination query params | `JOBS-LST-002` integration | UI has no pagination controls today |

---

## Environment and execution

**Tier B — full stack.** Every `JOBS-E2E-*` case requires:

| Service | Default |
|---------|---------|
| Vite frontend | `:5173` (started by Playwright `webServer`) |
| Backend API | `:1000` |
| MongoDB | `:27017` |

**Local run:**

```bash
docker compose -f docker-compose.dev.yml up backend mongo
npm run test:e2e -- tests/e2e/spec/jobs
```

**Skip behavior:** If the backend is unreachable, the suite MUST skip (same pattern as [`tests/e2e/spec/auth/auth.e2e.test.ts`](../../tests/e2e/spec/auth/auth.e2e.test.ts) using `isBackendAvailable()`).

**Fixtures:**

- `authenticated` fixture — registers a unique user per test via `POST /api/auth/register` ([`tests/e2e/fixtures/authenticated.ts`](../../tests/e2e/fixtures/authenticated.ts)).
- Log in through the UI or seed session before visiting `/jobs` unless the case starts unauthenticated.

**Test naming:** `*.e2e.test.ts`; each test title prefixed with bracketed ID, e.g. `[JOBS-E2E-011]`.

**Selectors:** Prefer `getByRole`, `getByLabel`, `getByText`. Avoid fragile CSS chains.

**Stability:** Use Playwright auto-waiting and `expect`; no `waitForTimeout()`. Register `page.on('pageerror')` when asserting the app does not crash.

---

## Auth prerequisites (not duplicated as jobs cases)

Jobs E2E assumes a valid session. Route protection is owned by auth E2E:

| ID | Rule | Steps | Assertions |
|----|------|-------|------------|
| **AUTH-E2E-020** | Unauthenticated user cannot view `/jobs` | `page.goto('/jobs')` without login | Redirect to `/login`; Login heading visible |
| **AUTH-E2E-022** | Authenticated user reaches `/jobs` | Log in → `page.goto('/jobs')` | URL `/jobs`; heading **Jobs** (level 1) visible |

All `JOBS-E2E-*` cases below assume the user is **already logged in** unless explicitly stated.

---

## Application UI reference

**Route:** `/jobs` ([`frontend/src/config/routes.config.ts`](../../frontend/src/config/routes.config.ts))

**Page:** [`Jobs.tsx`](../../frontend/src/components/pages/jobs/Jobs.tsx)

| User-visible control | Label / role | Component |
|---------------------|--------------|-----------|
| Page title | **Jobs** (heading level 1) | `Jobs` |
| Create action | **Create job** (button) | `Jobs` |
| Loading | Spinner (`role="status"`) while `isLoading` | `Jobs` |
| Job card | Card showing job name; click opens detail | `JobCard` |
| Card menu | **Edit**, **Open**, **Delete** | `JobCard` → `DropdownMenu` |
| Create/edit sheet title | **Create job** / **Edit job** | `JobSheet` |
| Form fields | **Name**, **Tools**, **Schedule** sections | `JobSheet` |
| Form submit | **Create** / **Edit** (primary sheet action) | `JobSheet` |
| Schedule type | **Type** select — `once`, `daily`, `weekly`, `monthly`, `yearly` | `JobSheet` |
| Schedule dates | **Start date**, **Start time**, **End date**, **End time** | `JobSheet` |
| Run on edit | **Run job** switch (edit only, unscheduled jobs) | `JobSheet` |
| Add tool | **Add tool** (button, `aria-label="Add tool"`) | `JobSheet` → `ToolDialog` |
| Tool dialog | Title **Add tool**; **Tool type**; confirm **Add tool** | `ToolDialog` |
| Detail sheet | Job name as title; **Executions** section | `JobDetailSheet` |
| Delete confirm | Title **Delete job**; confirm **Delete** (destructive) | `ConfirmationDialog` |

**Status badges on cards** ([`JobDetails.tsx`](../../frontend/src/components/pages/jobs/components/shared/jobDetails/JobDetails.tsx)): **Pending**, **Running** (with spinner), **Idle**, schedule type badge, **Next run** / **Last run** / **Start** / **End** labels.

---

## Backend APIs invoked by the jobs page

The UI uses bearer auth (`Authorization: Bearer <accessToken>`) and cookies (`credentials: 'include'`) via the frontend API client.

| UI action | HTTP call |
|-----------|-----------|
| Page mount | `GET /api/jobs/get-all` then `GET /api/jobs/stream-all` (SSE) |
| Create submit | `POST /api/jobs/create` |
| Edit submit | `PUT /api/jobs/update/:id` |
| Delete confirm | `DELETE /api/jobs/delete/:id` |

Full HTTP rules: [jobs-http-contract.md](../requirements/jobs-http-contract.md). Backend integration file: [`backend/test/integration/jobs-integration.test.ts`](../../backend/test/integration/jobs-integration.test.ts).

---

## HTTP rules referenced by E2E (inline glossary)

These `JOBS-*` IDs appear in jobs E2E requirements. Integration tests assert HTTP directly; E2E asserts the **UI outcome** described in the last column.

| HTTP ID | API behavior (summary) | What E2E must prove through the browser |
|---------|------------------------|-------------------------------------------|
| **JOBS-LST-001** | Authenticated user with no jobs: `GET /api/jobs/get-all` → **200**, `data: []` | No job cards; **Create job** enabled after load |
| **JOBS-CRT-001** | `POST /api/jobs/create` with `schedule: null` → **201**, job id and name in `data` | New card with name; persists after reload |
| **JOBS-CRT-002** | `POST` with schedule → **201**, `schedule.type`, `nextRun` set | Card shows schedule type or next-run text |
| **JOBS-UNQ-002** | Same user, duplicate name on create → **409** `CONFLICT_ERROR` | Visible error; sheet open; no duplicate card |
| **JOBS-UNQ-003** | Rename to another owned job name → **409** `CONFLICT_ERROR` | Visible error; original name on card |
| **JOBS-GET-001** | Owner GET scheduled job → **200** with enriched schedule | Detail sheet shows name and schedule-related content |
| **JOBS-UPD-001** | Owner updates name → **200**; GET shows change | Card shows new name after save and reload |
| **JOBS-UPD-002** | Owner sets `schedule: null` → **200** | Card shows unscheduled state |
| **JOBS-UPD-003** | `schedule: null` + `runJob: true` → **200** | Triggers run; running state on card |
| **JOBS-UPD-004** | Update while delegate running → **422** `BUSINESS_LOGIC_ERROR` | Edit blocked or error shown (timing-sensitive) |
| **JOBS-DEL-001** | Owner DELETE → **200**; follow-up GET → **404** | Card removed; absent after reload |
| **JOBS-SCH-001** | `startDate` not strictly future → **400** `VALIDATION_ERROR` on `startDate` | User-visible schedule error |
| **JOBS-SCH-002** | `endDate` before `startDate` → **400** on `startDate` | User-visible schedule error |
| **JOBS-SCH-003** | `type: once` with `endDate` → **400** on `endDate` | Client blocks submit or shows error |
| **JOBS-TLR-001** | Scraper missing keywords → **400** on `keywords` | Validation feedback; job not saved |
| **JOBS-TLR-003** | Email missing subject/body → **400** on `subject` or `body` | Validation feedback |
| **JOBS-SSE-001** | `GET /api/jobs/stream-all` → **200** `text/event-stream`, `running-jobs` events | Page opens stream on mount; running badge updates live |

**Not covered by jobs E2E** (integration only): `JOBS-AUTH-001`, `JOBS-LST-002`, `JOBS-ISO-*`, `JOBS-GET-002`, `JOBS-UNQ-001`, `JOBS-TLR-002`, `JOBS-UPD-005`, `JOBS-DEL-002`.

---

## Error UX policy

When a jobs API call returns `success: false`, the user MUST receive **visible feedback** (inline field error, toast, or dialog)—not silent failure.

**Implementation blocker:** Error UI for jobs CRUD is **not implemented today**. [`Jobs.tsx`](../../frontend/src/components/pages/jobs/Jobs.tsx) catches create, update, and delete failures with `console.log` / `console.error` only. **Do not implement the E2E cases below until the product surfaces these errors in the UI** — otherwise tests have nothing stable to assert.

| Blocked until error UI exists | Scenario |
|-------------------------------|----------|
| **JOBS-E2E-013** | Duplicate name on create (**409**) |
| **JOBS-E2E-033** | Rename conflict (**409**) |
| **JOBS-E2E-060** | Past start date (**400** validation) |
| **JOBS-E2E-061** | Invalid date range (**400** validation) |
| **JOBS-E2E-062** | Conflict error surfaced (create or update) |
| **JOBS-E2E-072** | Scraper keywords validation (**400**) |
| **JOBS-E2E-074** | Email subject/body validation (**400**) |
| **JOBS-E2E-083** | Edit blocked while running (**422**) |

Track readiness in the traceability table **Status** column. Mark cases **Implemented** only after both error UI and the Playwright spec exist.

---

## Test cases

### Listing and page load

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-001** | P0 | Authenticated user sees Jobs page ready | Logged-in user (may have zero or more jobs) | Navigate to `/jobs` | URL `/jobs`; heading **Jobs** visible; **Create job** enabled after load; no `pageerror` | Exercises `GET /api/jobs/get-all` success path (see **JOBS-LST-001** when list empty) |
| **JOBS-E2E-002** | P0 | New user sees empty list | Fresh `testUser` with no jobs created | Navigate to `/jobs`; wait for load | No job cards; **Create job** enabled | **JOBS-LST-001** — UI reflects empty `data[]` |
| **JOBS-E2E-003** | P1 | Loading state gates create action | Logged-in user; slow network optional | Navigate to `/jobs` | Before fetch completes: spinner visible, **Create job** disabled; after fetch: enabled | N/A (client loading UX) |

---

### Create

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-010** | P1 | Open create sheet | On `/jobs` | Click **Create job** | Sheet heading **Create job**; **Name** field; **Tools** and **Schedule** sections; primary **Create** | N/A (local UI) |
| **JOBS-E2E-011** | P0 | Create unscheduled job | On `/jobs` | Open sheet → fill **Name** (unique) → leave schedule empty → **Create** | Sheet closes; card with name visible; after `page.reload()` card still visible | **JOBS-CRT-001** — UI drives `POST` with `schedule: null` |
| **JOBS-E2E-012** | P1 | Create scheduled job | On `/jobs` | Open sheet → fill name → select schedule **Type** (e.g. `daily`) → future **Start date** and **Start time** → **Create** | Card shows schedule type badge and/or **Next run** text | **JOBS-CRT-002** |
| **JOBS-E2E-013** | P2 | Duplicate name on create | One job named `Alpha` already exists | Create second job also named `Alpha` | Visible error; sheet stays open; only one `Alpha` card | **JOBS-UNQ-002** — UI handles **409** |
| **JOBS-E2E-014** | P1 | Cancel create | On `/jobs` | Open sheet → dismiss without submit | List unchanged; no new card | N/A |

---

### Read / detail

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-020** | P1 | Open detail via card click | At least one job on list | Click job card | Detail sheet: job name as title; **Executions** section visible | **JOBS-GET-001** when job is scheduled |
| **JOBS-E2E-021** | P1 | Open detail via menu | At least one job | Card menu → **Open** | Same detail sheet as card click | N/A |
| **JOBS-E2E-022** | P1 | Close detail sheet | Detail sheet open | Close sheet | Jobs list visible; card still present | N/A |

---

### Update

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-030** | P1 | Edit job name | Job `Alpha` exists | Menu → **Edit** → change **Name** → **Edit** | Sheet shows **Edit job** with prefilled name; card shows new name; persists after reload | **JOBS-UPD-001** |
| **JOBS-E2E-031** | P1 | Clear schedule | Scheduled job exists | **Edit** → clear **Type** / schedule fields → **Edit** | Card shows **Un-scheduled** or no schedule badge | **JOBS-UPD-002** |
| **JOBS-E2E-032** | P1 | Cancel edit | Job exists | **Edit** → change name → close without save | Card still shows original name and schedule | N/A |
| **JOBS-E2E-033** | P2 | Rename conflict | Jobs `Alpha` and `Beta` exist | Edit `Beta` → rename to `Alpha` → **Edit** | Visible error; card still **Beta** | **JOBS-UNQ-003** |
| **JOBS-E2E-034** | P3 | Run job from edit | Unscheduled job exists | **Edit** → enable **Run job** → **Edit** | Card shows **Running** while delegate active | **JOBS-UPD-003**; timing-sensitive |

---

### Delete

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-040** | P0 | Delete with confirmation | Job exists | Menu → **Delete** → confirm **Delete** in dialog | Dialog title **Delete job**; card removed; absent after reload | **JOBS-DEL-001** |
| **JOBS-E2E-041** | P1 | Cancel delete | Job exists | **Delete** → dismiss dialog | Card remains | N/A |

---

### Form validation (client)

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-050** | P2 | Empty name blocked | Create sheet open | Submit without name | Stays on sheet; no card created | Client `required` on **Name**; API not called |
| **JOBS-E2E-051** | P2 | Schedule fields required | Create sheet open | Select **Type** → submit without date/time | Stays on sheet; no card | Mirrors **JOBS-SCH-001** intent at client |
| **JOBS-E2E-052** | P2 | Once + end date invalid | Create sheet open | **Type** = `once` → set **End date** → submit | Blocked or validation message; no card | **JOBS-SCH-003** |

---

### Server validation and errors (UI)

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-060** | P2 | Past start date error | Create sheet open | Schedule with **start date in the past** → submit | Visible error on schedule fields | **JOBS-SCH-001** — **400** surfaced in UI |
| **JOBS-E2E-061** | P2 | Invalid date range | Create sheet open | **End date** before **Start date** → submit | Visible schedule error | **JOBS-SCH-002** |
| **JOBS-E2E-062** | P2 | Conflict error surfaced | Duplicate or rename conflict scenario | Submit conflicting name | Visible error message (not console only) | **JOBS-UNQ-002** or **JOBS-UNQ-003** |

---

### Tools (scraper and email)

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-070** | P2 | Open tool dialog | Create/edit sheet open | Click **Add tool** | Dialog **Add tool**; **Tool type**; confirm **Add tool** | N/A |
| **JOBS-E2E-071** | P2 | Persist scraper tool | Create sheet open | Add scraper with target, **keywords**, **max pages** → save job | Tool reflected in detail after reload | **JOBS-CRT-001** with tools |
| **JOBS-E2E-072** | P2 | Scraper keywords required | Scraper tool added | Submit job without keywords | Validation feedback; job not saved | **JOBS-TLR-001** |
| **JOBS-E2E-073** | P2 | Persist email tool | Create sheet open | Add email with **subject** and **body** → save | Tool persisted after reload | **JOBS-CRT-001** with email tool |
| **JOBS-E2E-074** | P2 | Email fields required | Email tool added | Submit without subject or body | Validation feedback | **JOBS-TLR-003** |

---

### Live updates (executions and SSE)

**Tier C — timing-sensitive.** Optional for initial CI; may need extended timeouts or seeded runs.

| ID | P | Business rule | Setup | Steps | Assertions | HTTP alignment |
|----|---|---------------|-------|-------|------------|----------------|
| **JOBS-E2E-080** | P3 | Running indicator | Job run triggered (edit **Run job** or scheduled run) | Wait for delegate | Card badge **Running** with spinner | **JOBS-SSE-001** — `running-jobs` stream |
| **JOBS-E2E-081** | P3 | Run finished updates card | Job was running | Wait for completion | **Running** clears; **Last run** updates without manual refresh | SSE `job-finished` |
| **JOBS-E2E-082** | P3 | Executions in detail | Job completed at least one run | Open detail sheet | **Executions** lists entries; expand shows tool/target results | Stream + persisted execution data |
| **JOBS-E2E-083** | P3 | Edit blocked while running | Job currently running | Menu → **Edit** | Blocked or error message | **JOBS-UPD-004** |

---

## Priority summary

| Priority | IDs | Focus |
|----------|-----|--------|
| **P0** | 001, 002, 011, 040 | Page load, empty state, create, delete |
| **P1** | 003, 010, 014, 020–022, 030–032, 031, 041 | Loading, sheets, detail, edit, cancel |
| **P2** | 012, 013, 033, 050–052, 060–062, 070–074 | Schedule, conflicts, validation, tools |
| **P3** | 034, 080–083 | Run job, SSE, live execution |

**Total: 35 test cases.**

---

## Explicitly out of E2E scope

| Item | Owner layer | Reason |
|------|-------------|--------|
| Cross-user isolation (`JOBS-ISO-*`) | Backend integration | Requires two authenticated users |
| Missing bearer on API (`JOBS-AUTH-001`) | Backend integration | No UI for raw header omission |
| Pagination params (`JOBS-LST-002`) | Backend integration | UI does not expose pagination |
| Non-existent id GET/DELETE (`JOBS-GET-002`, `JOBS-DEL-002`) | Backend integration | User cannot navigate to invalid ids |
| Scraper portal automation | Backend delegator | Not a frontend journey |
| SSE payload schema details | Backend integration | E2E asserts user-visible indicators only |

---

## Traceability and implementation status

| ID | Scenario | Spec file | Status |
|----|----------|-----------|--------|
| JOBS-E2E-001 | Jobs page load | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-002 | Empty list | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-003 | Loading state | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-010 | Open create sheet | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-011 | Create unscheduled job | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-012 | Create scheduled job | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-013 | Duplicate name on create | `tests/e2e/spec/jobs/` | Planned — blocked until error UI |
| JOBS-E2E-014 | Cancel create | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-020 | Open detail via card | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-021 | Open detail via menu | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-022 | Close detail sheet | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-030 | Edit job name | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-031 | Clear schedule on edit | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-032 | Cancel edit | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-033 | Rename conflict | `tests/e2e/spec/jobs/` | Planned — blocked until error UI |
| JOBS-E2E-034 | Run job on edit | `tests/e2e/spec/jobs/` | Planned — Tier C |
| JOBS-E2E-040 | Delete with confirmation | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-041 | Cancel delete | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-050 | Empty name validation | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-051 | Schedule fields required | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-052 | Once schedule end date | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-060 | Past start date error | `tests/e2e/spec/jobs/` | Planned — blocked until error UI |
| JOBS-E2E-061 | Invalid date range error | `tests/e2e/spec/jobs/` | Planned — blocked until error UI |
| JOBS-E2E-062 | Conflict error surfaced | `tests/e2e/spec/jobs/` | Planned — blocked until error UI |
| JOBS-E2E-070 | Open tool dialog | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-071 | Create job with scraper | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-072 | Scraper keywords validation | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-073 | Create job with email tool | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-074 | Email subject/body validation | `tests/e2e/spec/jobs/` | Planned |
| JOBS-E2E-080 | Running indicator | `tests/e2e/spec/jobs/` | Planned — Tier C |
| JOBS-E2E-081 | Run finished updates card | `tests/e2e/spec/jobs/` | Planned — Tier C |
| JOBS-E2E-082 | Executions in detail sheet | `tests/e2e/spec/jobs/` | Planned — Tier C |
| JOBS-E2E-083 | Edit blocked while running | `tests/e2e/spec/jobs/` | Planned — Tier C |

Update **Status** to **Implemented** when `[JOBS-E2E-xxx]` exists in a spec file and passes in CI.

---

## Change control

- **UI-only changes** that preserve user-visible behavior: no ID change.
- **New user journeys:** assign next free `JOBS-E2E-*` ID; add row to traceability table and HTTP glossary if applicable.
- **HTTP contract changes** ([jobs-http-contract.md](../requirements/jobs-http-contract.md)): update the glossary and affected E2E rows in this document, then update Playwright tests.
