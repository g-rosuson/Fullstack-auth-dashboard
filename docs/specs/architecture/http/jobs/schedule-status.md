# HTTP — Change schedule status

`PUT /api/jobs/change-schedule-status/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

## HTTP-JOBS-SSC-001 — Set status to stopped

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned scheduled job that is not running; current persisted status is `idle`
  - Required body fields: `status`
  - Values: `status` = `stopped`
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `stopped`

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-SSC-002 — Set status to active (idle)

- Request:
  - Same shape as HTTP-JOBS-SSC-001
  - Values: current persisted status is `stopped`; `status` = `idle`; schedule still activatable (end not past; once start not past)
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` = `idle`

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-SSC-003 — Reject same status

- Request:
  - Same shape as HTTP-JOBS-SSC-001
  - Values: `status` equals the job’s current persisted schedule status
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SSC-004](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SCH-008](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-SSC-004 — Reject when job has no schedule

- Request:
  - Same shape as HTTP-JOBS-SSC-001
  - Values: owned job with `schedule` = `null`
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SSC-005](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-SSC-005 — Reject while running

- Request:
  - Same shape as HTTP-JOBS-SSC-001
  - Values: `id` is currently running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SSC-006](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-SSC-006 — Reject activate when recurring end is past

- Request:
  - Same shape as HTTP-JOBS-SSC-002
  - Values: recurring schedule; `endDate` is now or in the past
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SCH-006](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-SSC-007 — Reject activate when once start is past

- Request:
  - Same shape as HTTP-JOBS-SSC-002
  - Values: `schedule.type` = `once`; `startDate` is now or in the past
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-ONCE-002](../../../requirements/fr/jobs/schedule/once.md)

## HTTP-JOBS-SSC-008 — Post-save attach failure warning

Status is persisted; runtime attach fails.

- Request:
  - Same shape as HTTP-JOBS-SSC-001 or HTTP-JOBS-SSC-002
  - Values: otherwise valid status change; scheduling fails after persist
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string, warnings: [{ code: "JOBS_FAILED_TO_SCHEDULE_JOB", message: string }] } }`
  - Notes: `data.schedule.status` equals the requested intent

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-008](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-011](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-SSC-009 — Invalid body

- Request:
  - `Content-Type: application/json`
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job
  - Formats: body fails OpenAPI / Zod `changeJobScheduleStatusPayloadSchema`
- Response:
  - Status: `400`
  - Body: `{ success: false, code: "VALIDATION_ERROR", timestamp: string, issues: […] }`

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
