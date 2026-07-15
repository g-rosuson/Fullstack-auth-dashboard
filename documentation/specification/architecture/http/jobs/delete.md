# HTTP — Delete job

`DELETE /api/jobs/delete/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

## HTTP-JOBS-DEL-001 — Delete owned job

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = owned job that is not running
- Response:
  - Status: `200`
  - Body: `{ success: true, data: { id: string }, meta: { timestamp: string } }`
  - Notes: `data.id` equals the path `id`

Traces:
- [FR-JOBS-DEL-001](../../../requirements/fr/jobs/lifecycle/delete.md)
- [FR-JOBS-DEL-002](../../../requirements/fr/jobs/lifecycle/delete.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-DEL-002 — Reject while running

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` is currently running for this user
- Response:
  - Status: `422`
  - Body: `{ success: false, code: "BUSINESS_LOGIC_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-DEL-003](../../../requirements/fr/jobs/lifecycle/delete.md)

## HTTP-JOBS-DEL-003 — Not returned after delete

After HTTP-JOBS-DEL-001, get by the same id fails as [HTTP-JOBS-OWN-001](./ownership.md).

- Request:
  - Method/path: `GET /api/jobs/get/:id` with the deleted id
  - Header: `Authorization: Bearer <access-token>`
- Response:
  - Status: `404`
  - Body: `{ success: false, code: "NOT_FOUND_ERROR", timestamp: string }`

Traces:
- [FR-JOBS-DEL-002](../../../requirements/fr/jobs/lifecycle/delete.md)
- [HTTP-JOBS-OWN-001](./ownership.md)
