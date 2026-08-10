# HTTP — Retry schedule

`POST /api/jobs/retry-schedule/:id`

Re-attaches runtime from persisted schedule intent without changing that intent. Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

## HTTP-JOBS-RTY-001 — Retry active (idle) intent

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job with persisted `schedule.status` = `idle`; not running; schedule still activatable
  - No body
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` remains `idle`

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-008](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-RTY-002 — Retry stopped intent

- Request:
  - Same as HTTP-JOBS-RTY-001
  - Values: persisted `schedule.status` = `stopped`
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string } }`
  - Notes: `data.schedule.status` remains `stopped`

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)

## HTTP-JOBS-RTY-003 — Attach failure warning

- Request:
  - Same as HTTP-JOBS-RTY-001
  - Values: otherwise valid retry; scheduling fails
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <Job>, meta: { timestamp: string, warnings: [{ code: "JOBS_FAILED_TO_SCHEDULE_JOB", message: string }] } }`
  - Notes: persisted status unchanged

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-011](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-RTY-004 — Reject without schedule

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job with `schedule` = `null`
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-RTY-005 — Reject while running

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` is currently running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-RTY-006 — Reject idle retry when recurring end is past

- Request:
  - Same as HTTP-JOBS-RTY-001
  - Values: recurring; `endDate` is now or in the past
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-SCH-006](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-RTY-007 — Reject idle retry when once start is past

- Request:
  - Same as HTTP-JOBS-RTY-001
  - Values: `type` = `once`; `startDate` is now or in the past
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-ONCE-002](../../../requirements/fr/jobs/schedule/once.md)
