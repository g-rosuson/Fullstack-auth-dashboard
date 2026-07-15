# HTTP — Create job

`POST /api/jobs/create`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md).

## HTTP-JOBS-CRT-001 — Create without schedule

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Required body fields: `name`, `tools`, `schedule`
  - Values: `schedule` = `null`; `tools` valid per OpenAPI / Zod `createJobInputSchema`
- Response:
  - Status: `201`
  - Body: `{ success: true, data: <enriched job>, meta: { timestamp: string } }`
  - Notes: `data.schedule` is `null`; tools run starts after save (not asserted on this response)

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-CRT-002](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-RUN-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-CRT-002 — Create with active schedule

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Required body fields: `name`, `tools`, `schedule`
  - Values: `schedule.status` = `idle`; start/end valid per OpenAPI / Zod `createJobInputSchema`
- Response:
  - Status: `201`
  - Body: `{ success: true, data: <enriched job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `idle`; `data.schedule.nextRun` may be an ISO string or `null`

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-CRT-003](../../../requirements/fr/jobs/lifecycle/create.md)

## HTTP-JOBS-CRT-003 — Create with stopped schedule

- Request:
  - Same shape as HTTP-JOBS-CRT-002
  - Values: `schedule.status` = `stopped`
- Response:
  - Status: `201`
  - Body: `{ success: true, data: <enriched job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `stopped`; `data.schedule.nextRun` = `null`; `data.schedule.lastRun` = `null`

Traces:
- [FR-JOBS-CRT-006](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-CRT-004 — Post-save schedule failure warning

Job is saved; runtime attach fails. Response still succeeds with a warning.

- Request:
  - Same shape as HTTP-JOBS-CRT-002 (active schedule)
  - Values: otherwise valid create; scheduling fails after persist
- Response:
  - Status: `201`
  - Body: `{ success: true, data: <enriched job>, meta: { timestamp: string, warnings: [{ code: "JOBS_FAILED_TO_SCHEDULE_JOB", message: string }] } }`
  - Notes: `data.schedule` still present with owner intent; `nextRun` / `lastRun` are `null`

Traces:
- [FR-JOBS-CRT-005](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-011](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-CRT-005 — Duplicate name for same user

- Request:
  - Same shape as HTTP-JOBS-CRT-001 or HTTP-JOBS-CRT-002
  - Values: `name` already used by this user
- Response:
  - Status: `409`
  - Body: `{ success: false, code: "CONFLICT_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-UNQ-001](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-UNQ-002](../../../requirements/fr/jobs/lifecycle/create.md)

## HTTP-JOBS-CRT-006 — Invalid body

Missing/invalid fields, tools, or schedule rules (OpenAPI / Zod `createJobInputSchema`).

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Required body fields: `name`, `tools`, `schedule`
  - Formats: at least one field fails schema / schedule / tools validation
- Response:
  - Status: `400`
  - Body: `{ success: false, code: "VALIDATION_ERROR", timestamp: string, issues: […] }`

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-SCH-001](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-002](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-ONCE-001](../../../requirements/fr/jobs/schedule/once.md)
