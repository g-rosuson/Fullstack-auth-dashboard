# Jobs — end-to-end test requirements

**Canonical source** for browser-level jobs test cases. Playwright specs in [`tests/e2e/spec/jobs/`](../../tests/e2e/spec/jobs/) MUST implement scenarios listed here.

**Scope:** User-visible behavior on `/jobs` with a live backend and MongoDB.

**HTTP rules** live in [jobs-http-contract.md](./jobs-http-contract.md) (`JOBS-*`). This document defines UI setup, steps, and assertions only — link to the contract by ID, do not restate API rules here.

> **Prerequisite — error UI not yet implemented.** [`Jobs.tsx`](../../frontend/src/components/pages/jobs/Jobs.tsx) logs API failures to the console only. Defer E2E cases marked **blocked until error UI** in the [traceability table](#traceability). See [Error UX policy](#error-ux-policy).

**Related documents:**

| Document | Use when |
|----------|----------|
| [jobs-http-contract.md](./jobs-http-contract.md) | API rules (`JOBS-*`) |
| [auth-http-contract.md](./auth-http-contract.md) | Session model |
| [auth-e2e-contract.md](./auth-e2e-contract.md) | Auth browser journeys (`AUTH-E2E-*`) |
| [e2e-testing.md](../guides/e2e-testing.md) | Playwright setup and conventions |

---

## Requirement IDs

| Prefix | Verified by |
|--------|-------------|
| **`JOBS-E2E-*`** | `tests/e2e/spec/jobs/*.e2e.test.ts` |
| **`JOBS-*`** | `backend/test/integration/jobs-integration.test.ts` |
| **`AUTH-E2E-*`** | `tests/e2e/spec/auth/*.e2e.test.ts` |

E2E complements integration: integration asserts HTTP; E2E asserts the UI calls those APIs and reflects results to the user. See [cross-reference](#cross-reference).

---

## Environment and execution

**Tier B — full stack.** Vite `:5173`, backend `:1000`, MongoDB `:27017`.

```bash
docker compose -f docker-compose.dev.yml up backend mongo
npm run test:e2e -- tests/e2e/spec/jobs
```

Skip the suite when the backend is unreachable (`isBackendAvailable()`, same as auth E2E).

**Fixtures:** `authenticated` — unique user via `POST /api/auth/register` ([`tests/e2e/fixtures/authenticated.ts`](../../tests/e2e/fixtures/authenticated.ts)). Log in before visiting `/jobs` unless stated otherwise.

**Naming:** `*.e2e.test.ts`; titles prefixed `[JOBS-E2E-xxx]`. Prefer `getByRole` / `getByLabel`; no `waitForTimeout()`.

---

## Auth prerequisites

Not duplicated as jobs cases — see [auth-e2e-contract.md](./auth-e2e-contract.md):

| ID | Rule |
|----|------|
| **AUTH-E2E-020** | Unauthenticated `/jobs` → `/login` |
| **AUTH-E2E-022** | Authenticated user reaches `/jobs`, **Jobs** heading visible |

All cases below assume a logged-in user.

---

## Application UI reference

**Route:** `/jobs` · **Page:** [`Jobs.tsx`](../../frontend/src/components/pages/jobs/Jobs.tsx)

| Control | Label / role |
|---------|--------------|
| Page title | **Jobs** (heading level 1) |
| Create | **Create job** (button; disabled while loading) |
| Loading | Spinner (`role="status"`) |
| Job card | Click opens detail; menu: **Edit**, **Open**, **Delete** |
| Form sheet | **Create job** / **Edit job**; submit **Create** / **Edit** |
| Fields | **Name**; **Tools**; **Schedule** (**Type**, **Start date/time**, **End date/time**) |
| Run on edit | **Run job** switch (unscheduled jobs only) |
| Tools | **Add tool** → dialog **Add tool**, **Tool type** |
| Detail sheet | Job name; **Executions** |
| Delete confirm | **Delete job** dialog; confirm **Delete** |

Status badges: **Pending**, **Running**, **Idle**, **Next run**, **Last run** ([`JobDetails.tsx`](../../frontend/src/components/pages/jobs/components/shared/jobDetails/JobDetails.tsx)).

API routes invoked by the page: see [jobs-http-contract.md](./jobs-http-contract.md) § Canonical routes.

---

## Error UX policy

When a jobs API returns `success: false`, the user MUST see visible feedback — not silent `console.log` failure.

Do not implement error-dependent E2E until the frontend surfaces these failures. Blocked IDs are listed in [traceability](#traceability).

---

## Cross-reference

Maps each E2E case to related HTTP rule(s). Full rule text: [jobs-http-contract.md](./jobs-http-contract.md).

| E2E ID | HTTP ID(s) |
|--------|------------|
| JOBS-E2E-001 | — |
| JOBS-E2E-002 | JOBS-LST-001 |
| JOBS-E2E-003 | — |
| JOBS-E2E-010 | — |
| JOBS-E2E-011 | JOBS-CRT-001 |
| JOBS-E2E-012 | JOBS-CRT-002 |
| JOBS-E2E-013 | JOBS-UNQ-002 |
| JOBS-E2E-014 | — |
| JOBS-E2E-020 | JOBS-GET-001 |
| JOBS-E2E-021 | — |
| JOBS-E2E-022 | — |
| JOBS-E2E-030 | JOBS-UPD-001 |
| JOBS-E2E-031 | JOBS-UPD-002 |
| JOBS-E2E-032 | — |
| JOBS-E2E-033 | JOBS-UNQ-003 |
| JOBS-E2E-034 | JOBS-UPD-003 |
| JOBS-E2E-040 | JOBS-DEL-001 |
| JOBS-E2E-041 | — |
| JOBS-E2E-050 | — |
| JOBS-E2E-051 | — |
| JOBS-E2E-052 | JOBS-SCH-003 |
| JOBS-E2E-060 | JOBS-SCH-001 |
| JOBS-E2E-061 | JOBS-SCH-002 |
| JOBS-E2E-062 | JOBS-UNQ-002, JOBS-UNQ-003 |
| JOBS-E2E-070 | — |
| JOBS-E2E-071 | JOBS-CRT-001 |
| JOBS-E2E-072 | JOBS-TLR-001 |
| JOBS-E2E-073 | JOBS-CRT-001 |
| JOBS-E2E-074 | JOBS-TLR-003 |
| JOBS-E2E-080 | JOBS-SSE-001 |
| JOBS-E2E-081 | — |
| JOBS-E2E-082 | — |
| JOBS-E2E-083 | JOBS-UPD-004 |

**Integration only** (no E2E planned): `JOBS-AUTH-001`, `JOBS-LST-002`, `JOBS-ISO-*`, `JOBS-GET-002`, `JOBS-UNQ-001`, `JOBS-TLR-002`, `JOBS-UPD-005`, `JOBS-DEL-002`.

---

## Test cases

### Listing and page load

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-001** | P0 | Jobs page ready | Logged-in user | Navigate to `/jobs` | URL `/jobs`; **Jobs** heading; **Create job** enabled after load; no `pageerror` |
| **JOBS-E2E-002** | P0 | Empty list | Fresh user, no jobs | Navigate to `/jobs` | No job cards; **Create job** enabled |
| **JOBS-E2E-003** | P1 | Loading state | Logged-in user | Navigate to `/jobs` | Spinner + disabled **Create job** while loading; enabled after |

### Create

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-010** | P1 | Open create sheet | On `/jobs` | Click **Create job** | **Create job** heading; **Name**; **Tools**; **Schedule**; **Create** |
| **JOBS-E2E-011** | P0 | Create unscheduled job | On `/jobs` | Open sheet → **Name** (unique) → **Create** | Sheet closes; card visible; persists after reload |
| **JOBS-E2E-012** | P1 | Create scheduled job | On `/jobs` | Name + **Type** + future start date/time → **Create** | Card shows schedule badge or **Next run** |
| **JOBS-E2E-013** | P2 | Duplicate name on create | Job `Alpha` exists | Create second `Alpha` | Visible error; sheet open; one card |
| **JOBS-E2E-014** | P1 | Cancel create | On `/jobs` | Open sheet → dismiss | No new card |

### Read / detail

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-020** | P1 | Open detail via card | Job on list | Click card | Name as title; **Executions** visible |
| **JOBS-E2E-021** | P1 | Open detail via menu | Job on list | Menu → **Open** | Same as card click |
| **JOBS-E2E-022** | P1 | Close detail sheet | Detail open | Close sheet | List visible; card remains |

### Update

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-030** | P1 | Edit job name | Job exists | **Edit** → new name → **Edit** | Prefilled name; card updated; persists after reload |
| **JOBS-E2E-031** | P1 | Clear schedule | Scheduled job | **Edit** → clear schedule → **Edit** | Card shows unscheduled |
| **JOBS-E2E-032** | P1 | Cancel edit | Job exists | **Edit** → change name → close | Original name and schedule unchanged |
| **JOBS-E2E-033** | P2 | Rename conflict | Jobs `Alpha`, `Beta` | Rename `Beta` → `Alpha` | Visible error; card still **Beta** |
| **JOBS-E2E-034** | P3 | Run job from edit | Unscheduled job | **Edit** → **Run job** → **Edit** | **Running** on card while active |

### Delete

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-040** | P0 | Delete with confirmation | Job exists | **Delete** → confirm **Delete** | Card removed; absent after reload |
| **JOBS-E2E-041** | P1 | Cancel delete | Job exists | **Delete** → dismiss | Card remains |

### Form validation (client)

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-050** | P2 | Empty name blocked | Create sheet open | Submit without name | Stays on sheet; no card |
| **JOBS-E2E-051** | P2 | Schedule fields required | Create sheet open | **Type** selected, no date/time → submit | Stays on sheet; no card |
| **JOBS-E2E-052** | P2 | Once + end date invalid | Create sheet open | **once** + **End date** → submit | Blocked or validation message; no card |

### Server validation and errors (UI)

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-060** | P2 | Past start date error | Create sheet open | Past **Start date** → submit | Visible schedule error |
| **JOBS-E2E-061** | P2 | Invalid date range | Create sheet open | End before start → submit | Visible schedule error |
| **JOBS-E2E-062** | P2 | Conflict error surfaced | Duplicate/conflict scenario | Submit conflicting name | Visible error (not console only) |

### Tools

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-070** | P2 | Open tool dialog | Sheet open | **Add tool** | **Add tool** dialog; **Tool type** |
| **JOBS-E2E-071** | P2 | Persist scraper tool | Create sheet | Scraper + keywords + max pages → save | Tool visible after reload |
| **JOBS-E2E-072** | P2 | Scraper keywords required | Scraper added | Submit without keywords | Validation feedback; not saved |
| **JOBS-E2E-073** | P2 | Persist email tool | Create sheet | Email + subject + body → save | Tool persisted after reload |
| **JOBS-E2E-074** | P2 | Email fields required | Email tool added | Submit without subject/body | Validation feedback |

### Live updates (Tier C)

| ID | P | Business rule | Setup | Steps | Assertions |
|----|---|---------------|-------|-------|------------|
| **JOBS-E2E-080** | P3 | Running indicator | Run triggered | Wait | **Running** badge with spinner |
| **JOBS-E2E-081** | P3 | Run finished updates card | Job was running | Wait for completion | **Running** clears; **Last run** updates |
| **JOBS-E2E-082** | P3 | Executions in detail | Completed run | Open detail | **Executions** lists entries |
| **JOBS-E2E-083** | P3 | Edit blocked while running | Job running | Menu → **Edit** | Blocked or error message |

---

## Priority summary

| Priority | IDs |
|----------|-----|
| **P0** | 001, 002, 011, 040 |
| **P1** | 003, 010, 014, 020–022, 030–032, 031, 041 |
| **P2** | 012, 013, 033, 050–052, 060–062, 070–074 |
| **P3** | 034, 080–083 |

**Total: 35 test cases.**

---

## Traceability

| E2E ID | Scenario | Status |
|--------|----------|--------|
| JOBS-E2E-001 | Jobs page load | Planned |
| JOBS-E2E-002 | Empty list | Planned |
| JOBS-E2E-003 | Loading state | Planned |
| JOBS-E2E-010 | Open create sheet | Planned |
| JOBS-E2E-011 | Create unscheduled job | Planned |
| JOBS-E2E-012 | Create scheduled job | Planned |
| JOBS-E2E-013 | Duplicate name on create | Planned — blocked until error UI |
| JOBS-E2E-014 | Cancel create | Planned |
| JOBS-E2E-020 | Open detail via card | Planned |
| JOBS-E2E-021 | Open detail via menu | Planned |
| JOBS-E2E-022 | Close detail sheet | Planned |
| JOBS-E2E-030 | Edit job name | Planned |
| JOBS-E2E-031 | Clear schedule on edit | Planned |
| JOBS-E2E-032 | Cancel edit | Planned |
| JOBS-E2E-033 | Rename conflict | Planned — blocked until error UI |
| JOBS-E2E-034 | Run job on edit | Planned — Tier C |
| JOBS-E2E-040 | Delete with confirmation | Planned |
| JOBS-E2E-041 | Cancel delete | Planned |
| JOBS-E2E-050 | Empty name validation | Planned |
| JOBS-E2E-051 | Schedule fields required | Planned |
| JOBS-E2E-052 | Once schedule end date | Planned |
| JOBS-E2E-060 | Past start date error | Planned — blocked until error UI |
| JOBS-E2E-061 | Invalid date range error | Planned — blocked until error UI |
| JOBS-E2E-062 | Conflict error surfaced | Planned — blocked until error UI |
| JOBS-E2E-070 | Open tool dialog | Planned |
| JOBS-E2E-071 | Create job with scraper | Planned |
| JOBS-E2E-072 | Scraper keywords validation | Planned — blocked until error UI |
| JOBS-E2E-073 | Create job with email tool | Planned |
| JOBS-E2E-074 | Email subject/body validation | Planned — blocked until error UI |
| JOBS-E2E-080 | Running indicator | Planned — Tier C |
| JOBS-E2E-081 | Run finished updates card | Planned — Tier C |
| JOBS-E2E-082 | Executions in detail sheet | Planned — Tier C |
| JOBS-E2E-083 | Edit blocked while running | Planned — blocked until error UI |

Mark **Implemented** when `[JOBS-E2E-xxx]` exists in spec and passes in CI.

---

## Change control

- **UI-only changes** preserving behavior: no ID change.
- **New E2E case:** assign next `JOBS-E2E-*`; add rows to [cross-reference](#cross-reference) and [traceability](#traceability).
- **HTTP contract changes:** update [jobs-http-contract.md](./jobs-http-contract.md) first, then cross-ref links here.
