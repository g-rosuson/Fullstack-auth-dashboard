# HTTP — Read jobs

List: `GET /api/jobs/get-all`  
Get: `GET /api/jobs/get/:id`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Other-user / missing id: [HTTP-JOBS-OWN-001](./ownership.md).

## HTTP-JOBS-LST-001 — List own jobs

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Query (optional): `limit`, `offset` (strings; OpenAPI / Zod `paginatedRouteParamSchema`)
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <enriched job[]>, limit: number, offset: number, count: number, meta: { timestamp: string } }`
  - Notes: every `data[i]` belongs to the requesting user; scheduled entries may include `schedule.nextRun` / `schedule.lastRun` (ISO string or `null`)

Traces:
- [FR-JOBS-LST-001](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-LST-002](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-GET-002](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-GET-001 — Get own job by id

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - Path: `id` = existing job owned by the requester
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <enriched job>, meta: { timestamp: string } }`
  - Notes: when `data.schedule` is non-null, `nextRun` / `lastRun` are ISO string or `null`

Traces:
- [FR-JOBS-GET-001](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-GET-002](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)
