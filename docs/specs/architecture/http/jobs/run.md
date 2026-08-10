# HTTP — Run job

`POST /api/jobs/run/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

Tools start after the response. Clients observe progress via the jobs stream (`running-jobs`, target/finished events).

## HTTP-JOBS-RUN-001 — Run owned job that is not running

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is not currently running
- Response:
  - Status: `200`
  - Body: `{ success: true, data: { jobId: string }, meta: { timestamp: string } }`
  - Notes: `data.jobId` equals the path `id`; tools run starts after the response (not asserted on this body)

Traces:
- [FR-JOBS-RUN-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)
- [FR-JOBS-ONCE-003](../../../requirements/fr/jobs/schedule/once.md)
- [FR-JOBS-SCH-012](../../../requirements/fr/jobs/schedule/schedule.md)

## HTTP-JOBS-RUN-002 — Reject when already running

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is currently running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-RUN-004](../../../requirements/fr/jobs/execution/execution.md)
