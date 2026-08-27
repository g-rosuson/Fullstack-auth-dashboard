# TKT-JOBS-003 — Deliver live job stream events on WebKit

`fix/tkt-jobs-003-sse-live-events-webkit`

Labels: `fix`

## User story

As a job owner on Safari / WebKit, I want list status (Running, Active, Paused) to update from the live stream after connect so that create, pause, run, and stop are visible without a reload.

## Definition of done

- [ ] `sendSSE` (and stream open) in [`backend/src/aop/http/sse`](../../../backend/src/aop/http/sse/index.ts) flushes each event; prime WebKit with an SSE comment line (`:` …) that does **not** end in a blank line (a dispatched empty frame makes `JSON.parse` throw in [`stream.ts`](../../../frontend/src/api/service/client/stream.ts) on every browser). Set `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`. Update [`HTTP-JOBS-STR-001`](../../specs/architecture/http/jobs/stream.md) headers, the stream unit parser in [`jobs-controller-stream-jobs.test.ts`](../../../backend/src/modules/jobs/tests/jobs-controller-stream-jobs.test.ts), and the [SSE skill](../../../backend/.agents/skills/sse-streaming/SKILL.md)
- [ ] Jobs SSE client in [`stream.ts`](../../../frontend/src/api/service/client/stream.ts): `openWhenHidden: true`; skip frames with empty `data` before `JSON.parse`
- [ ] Existing Playwright jobs spec at [`tests/e2e/spec/jobs/jobs.e2e.test.ts`](../../../tests/e2e/spec/jobs/jobs.e2e.test.ts) passes on the WebKit project for live-update paths: [CLIENT-JOBS-CRT-002](../../specs/architecture/client/jobs/create.md), [CLIENT-JOBS-CRT-007](../../specs/architecture/client/jobs/create.md), [CLIENT-JOBS-CRT-008](../../specs/architecture/client/jobs/create.md), [CLIENT-JOBS-SSC-001](../../specs/architecture/client/jobs/list-entry.md) / [CLIENT-JOBS-SSC-002](../../specs/architecture/client/jobs/list-entry.md), [CLIENT-JOBS-RUN-001](../../specs/architecture/client/jobs/list-entry.md) / [CLIENT-JOBS-STP-001](../../specs/architecture/client/jobs/list-entry.md) / [CLIENT-JOBS-STR-001](../../specs/architecture/client/jobs/list-entry.md). Connect hydration [CLIENT-JOBS-STR-002](../../specs/architecture/client/jobs/list-entry.md) stays green on all three browsers

## Traces

- [FR-JOBS-STR-001](../../specs/requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-002](../../specs/requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-003](../../specs/requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-STR-001](../../specs/architecture/http/jobs/stream.md)
- [HTTP-JOBS-STR-003](../../specs/architecture/http/jobs/stream.md)
- [HTTP-JOBS-STR-004](../../specs/architecture/http/jobs/stream.md)
- [CLIENT-JOBS-STR-001](../../specs/architecture/client/jobs/list-entry.md)
- [CLIENT-JOBS-STR-003](../../specs/architecture/client/jobs/list-entry.md)
