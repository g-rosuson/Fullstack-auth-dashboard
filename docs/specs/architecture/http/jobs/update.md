# HTTP — Update job

`PUT /api/jobs/update/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

## HTTP-JOBS-UPD-001 — Update name, tools, and active schedule

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is not running
  - Required body fields: `name`, `tools`, `schedule`, `status`
  - Values: `schedule.status` = `idle`; body per OpenAPI / Zod `updateJobInputSchema`
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `idle`; tools run does not start from this response

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-UPD-002 — Clear schedule

- Request:
  - Same shape as HTTP-JOBS-UPD-001
  - Values: `schedule` = `null`
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule` is `null`; tools run does not start from this response

Traces:
- [FR-JOBS-UPD-002](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)

## HTTP-JOBS-UPD-003 — Update with stopped schedule

- Request:
  - Same shape as HTTP-JOBS-UPD-001
  - Values: `schedule.status` = `stopped`
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `stopped`; tools run does not start from this response

Traces:
- [FR-JOBS-UPD-004](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-UPD-004 — Reject while running

- Request:
  - Same shape as HTTP-JOBS-UPD-001
  - Values: `id` is currently running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-UPD-003](../../../requirements/fr/jobs/lifecycle/update.md)

## HTTP-JOBS-UPD-005 — Post-save schedule failure warning

- Request:
  - Same shape as HTTP-JOBS-UPD-001 (non-null schedule)
  - Values: otherwise valid update; scheduling fails after persist
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string, warnings: [{ code: "JOBS_FAILED_TO_SCHEDULE_JOB", message: string }] } }`
  - Notes: `data.schedule` still present with owner intent

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-011](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-UPD-006 — Duplicate rename for same user

- Request:
  - Same shape as HTTP-JOBS-UPD-001
  - Values: `name` already used by another job of this user
- Response:
  - Status: `409`
  - Body: `{ success: false, code: "CONFLICT_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-UNQ-001](../../../requirements/fr/jobs/lifecycle/uniqueness.md)

## HTTP-JOBS-UPD-007 — Invalid body

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job
  - Formats: body fails OpenAPI / Zod `updateJobInputSchema`
- Response:
  - Status: `400`
  - Body: `{ success: false, code: "VALIDATION_ERROR", timestamp: string, issues: […] }`

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-007](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-SCH-001](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-002](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-ONCE-001](../../../requirements/fr/jobs/schedule/once.md)
