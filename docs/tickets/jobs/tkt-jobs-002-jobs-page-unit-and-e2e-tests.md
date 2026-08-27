# TKT-JOBS-002 — Jobs page unit and e2e tests

`chore/tkt-jobs-002-jobs-page-unit-and-e2e-tests`

Labels: `chore`

## User story

As a frontend contributor, I want unit tests for the jobs page module and Playwright coverage of `/jobs` so that CLIENT-JOBS scenarios stay assertable without relying on manual clicks.

## Definition of done

- [ ] Co-located Vitest files under `frontend/src/components/pages/jobs/` named `*.test.tsx` (or `*.test.ts` for mappers). Rename [`Placeholder.unit.test.tsx`](../../../frontend/src/components/pages/jobs/components/placeholder/Placeholder.unit.test.tsx) to match
- [ ] Unit tests mock the jobs API and stream (same pattern as [`Authentication.test.tsx`](../../../frontend/src/components/pages/authentication/Authentication.test.tsx)). They do not hit a live backend
- [ ] Unit cases cite the CLIENT ID they prove, e.g. `it('[CLIENT-JOBS-LST-001] …')`. Existing mapper tests stay; extend them only if a scenario needs mapper coverage
- [ ] Unit coverage of the jobs page module against [client/jobs](../../specs/architecture/client/jobs/index.md): page views and placeholder ([read.md](../../specs/architecture/client/jobs/read.md)); sheet validation and field visibility ([create.md](../../specs/architecture/client/jobs/create.md), [update.md](../../specs/architecture/client/jobs/update.md), [sheet.md](../../specs/architecture/client/jobs/sheet.md)); list-entry chrome ([list-entry.md](../../specs/architecture/client/jobs/list-entry.md) presentation); detail open/close; mutation/stream toasts with mocked `toast` ([notifications.md](../../specs/architecture/client/jobs/notifications.md))
- [ ] Playwright jobs spec at [`tests/e2e/spec/jobs/jobs.e2e.test.ts`](../../../tests/e2e/spec/jobs/jobs.e2e.test.ts) using the authenticated fixture, a jobs page object, and accessible locators. Full-stack setup matches [auth e2e](../../../tests/e2e/spec/auth/auth.e2e.test.ts) / [`docs/artifacts/e2e-testing.md`](../../artifacts/e2e-testing.md)
- [ ] E2E cases cite CLIENT IDs and cover persist/reload and live-server paths that unit tests cannot: create/update/delete happy paths, uniqueness, owner-only list, run/stop/schedule-status actions, and stream hydration ([create.md](../../specs/architecture/client/jobs/create.md), [update.md](../../specs/architecture/client/jobs/update.md), [delete.md](../../specs/architecture/client/jobs/delete.md), [uniqueness.md](../../specs/architecture/client/jobs/uniqueness.md), [read.md](../../specs/architecture/client/jobs/read.md) `CLIENT-JOBS-LST-003`, [list-entry.md](../../specs/architecture/client/jobs/list-entry.md) actions and live updates, [sheet.md](../../specs/architecture/client/jobs/sheet.md) `CLIENT-JOBS-TLR-002`)
- [ ] `npm test` (frontend) and `npm run test:e2e -- tests/e2e/spec/jobs` pass with the documented e2e stack

## Traces

- [FR-JOBS (index)](../../specs/requirements/fr/jobs/index.md)
- [CLIENT-JOBS (index)](../../specs/architecture/client/jobs/index.md)
- [CLIENT-JOBS-CRT-*](../../specs/architecture/client/jobs/create.md)
- [CLIENT-JOBS-LST-* / GET-*](../../specs/architecture/client/jobs/read.md)
- [CLIENT-JOBS-UPD-*](../../specs/architecture/client/jobs/update.md)
- [CLIENT-JOBS-DEL-*](../../specs/architecture/client/jobs/delete.md)
- [CLIENT-JOBS-UNQ-*](../../specs/architecture/client/jobs/uniqueness.md)
- [CLIENT-JOBS-TLR-* / SCH-*](../../specs/architecture/client/jobs/sheet.md)
- [CLIENT-JOBS-ENT-* / RUN-* / STP-* / SSC-* / STR-*](../../specs/architecture/client/jobs/list-entry.md)
- [CLIENT-JOBS-NTF-*](../../specs/architecture/client/jobs/notifications.md)
