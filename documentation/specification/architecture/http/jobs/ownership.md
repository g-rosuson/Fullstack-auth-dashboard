# HTTP — Jobs ownership

Cross-cutting id-scoped access. Auth gate: [HTTP-AUTH-TOK-003](../auth/session.md).

Applies to get, update, delete, stop, change schedule status, and retry schedule.

## HTTP-JOBS-OWN-001 — Other user’s job or unknown id

Request for another user’s job is indistinguishable from a missing job.

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = unknown job, or a job owned by a different user
  - Method/path: any of
    - `GET /api/jobs/get/:id`
    - `PUT /api/jobs/update/:id`
    - `DELETE /api/jobs/delete/:id`
    - `POST /api/jobs/stop/:id`
    - `PUT /api/jobs/change-schedule-status/:id`
    - `POST /api/jobs/retry-schedule/:id`
- Response:
  - Status: `404`
  - Body: `{ success: false, code: "NOT_FOUND_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)
