# HTTP — Stop job

`POST /api/jobs/stop/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

Cancellation is asynchronous ([NFR-REL-JOBS-001](../../../requirements/nfr/reliability/jobs.md)). Clients observe completion via the jobs stream (`job-cancelled`, `running-jobs`).

## HTTP-JOBS-STP-001 — Stop owned running job

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is currently running
- Response:
  - Status: `200`
  - Body: `{ success: true, data: { jobId: string }, meta: { timestamp: string } }`
  - Notes: `data.jobId` equals the path `id`; in-flight work winds down after the response

Traces:
- [FR-JOBS-STP-001](../../../requirements/fr/jobs/execution/stop.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)
- [NFR-REL-JOBS-001](../../../requirements/nfr/reliability/jobs.md)

## HTTP-JOBS-STP-002 — Reject when not running

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is not running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-STP-002](../../../requirements/fr/jobs/execution/stop.md)
