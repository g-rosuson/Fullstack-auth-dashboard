# Client tests handoff

Implement Playwright E2E and frontend unit tests against client acceptance.

## Source of truth

- UI scenarios: `docs/specs/architecture/client/{auth,jobs}/` — cite `CLIENT-*`
- API scenarios: `docs/specs/architecture/http/` — cite `HTTP-*` in backend/integration (or E2E only when a specific API outcome must be visible)
- Rules: `.agents/skills/writing-docs/SKILL.md`, `docs/specs/architecture/client/README.md`

## ID → test layer

| Layer | Cites | Location |
|--------|--------|----------|
| E2E (Playwright) | `CLIENT-*` | `tests/e2e/spec/{auth,jobs}/` |
| Frontend unit | `CLIENT-*` | colocated `*.unit.test.tsx` / `*.test.tsx` under `frontend/src/` |
| Backend integration | `HTTP-*` | `backend/test/integration/` |

## Current state

- Auth E2E: `tests/e2e/spec/auth/auth.e2e.test.ts` — retitle to `[CLIENT-AUTH-*]` (map below)
- Jobs E2E: `tests/e2e/spec/jobs/jobs.e2e.test.ts` — implement from `client/jobs/*`
- Unit: sparse; cover current `jobsList` / `jobFormSheet` / auth components

### Auth title map

| Current title ID | Target |
|------------------|--------|
| AUTH-E2E-001 | `CLIENT-AUTH-LOG-001` |
| AUTH-E2E-002 | `CLIENT-AUTH-LOG-002` |
| AUTH-E2E-003 | `CLIENT-AUTH-LOG-003` |
| AUTH-E2E-004 | `CLIENT-AUTH-OUT-001` |
| AUTH-E2E-005 | `CLIENT-AUTH-LOG-004` |
| AUTH-E2E-006 | `CLIENT-AUTH-ACL-002` |
| AUTH-E2E-010 | `CLIENT-AUTH-REG-001` |
| AUTH-E2E-020 | `CLIENT-AUTH-ACL-001` |
| AUTH-E2E-021 | `CLIENT-AUTH-SES-001` |
| AUTH-E2E-022 | `CLIENT-AUTH-ACL-003` |
| AUTH-E2E-023 | `CLIENT-AUTH-SES-003` |

Add missing auth coverage as needed: `OUT-002`, `SES-002`, remaining `REG-*` when registration is enabled.

## Rules

1. Title format: `test('[CLIENT-AUTH-LOG-001] …')` / `it('[CLIENT-JOBS-CRT-002] …')`
2. Assert only the scenario’s setup → action → assert. Prefer roles/labels; no `waitForTimeout`
3. **Observational** when the control is not offered (e.g. `CLIENT-JOBS-RUN-002`, `CLIENT-JOBS-SSC-003`: Running → primary **Stop**; assert Run / schedule-status change unavailable — no error path)
4. **“Visible error”** asserts: generic visible error + outcome (flow stays open / action unavailable). If error UI is missing, implement it first or skip until it exists
5. Registration: gate on `features.registrationEnabled`; skip when disabled except `CLIENT-AUTH-REG-006`
6. Server-only FRs (reboot, pure HTTP rejects) → not client tests
7. Reuse `tests/e2e/fixtures/*`, `tests/e2e/pages/*`; extend page objects for jobs list/sheet

## Suggested order

1. Retitle auth E2E + fill auth gaps
2. Jobs E2E smoke: `LST-*`, `CRT-001/002`, `GET-*`, `RUN-001`, `ENT-*` presentation
3. Jobs E2E mutations: update / delete / schedule / stream / retry (`list-entry`, `sheet`, `update`, `delete`)
4. Unit: form validation + list-entry presentation (mocked API/stream) for sheet/`CRT-003..006`/`ENT-*`
5. Cases needing error UI: ship UI, then enable tests

## Commands

- E2E: `npm run test:e2e -- tests/e2e/spec/auth` / `…/jobs` (Vite + backend + Mongo)
- Frontend unit: existing Vitest / `*.unit.test.tsx` pattern under `frontend/`

## Do not

- Restate HTTP bodies in client tests
- Invent new `CLIENT-*` IDs — update acceptance docs first
