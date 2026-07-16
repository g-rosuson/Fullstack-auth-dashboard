# Jobs — HTTP

Realizes [fr/jobs](../../../requirements/fr/jobs/index.md). Writing rules: [HTTP acceptance](../README.md).

All routes below are protected: missing/invalid `Authorization: Bearer` fails as [HTTP-AUTH-TOK-003](../auth/session.md).

## Routes

- Create — `POST /api/jobs/create`
- List — `GET /api/jobs/get-all`
- Get — `GET /api/jobs/get/:id`
- Update — `PUT /api/jobs/update/:id`
- Delete — `DELETE /api/jobs/delete/:id`
- Change schedule status — `PUT /api/jobs/change-schedule-status/:id`
- Retry schedule — `POST /api/jobs/retry-schedule/:id`
- Stop — `POST /api/jobs/stop/:id`
- Stream — `GET /api/jobs/stream-all`

## Files

- [create.md](./create.md) — `HTTP-JOBS-CRT-*`
- [read.md](./read.md) — `HTTP-JOBS-LST-*`, `HTTP-JOBS-GET-*`
- [update.md](./update.md) — `HTTP-JOBS-UPD-*`
- [delete.md](./delete.md) — `HTTP-JOBS-DEL-*`
- [schedule-status.md](./schedule-status.md) — `HTTP-JOBS-SSC-*`
- [retry-schedule.md](./retry-schedule.md) — `HTTP-JOBS-RTY-*`
- [stop.md](./stop.md) — `HTTP-JOBS-STP-*`
- [stream.md](./stream.md) — `HTTP-JOBS-STR-*`
- [ownership.md](./ownership.md) — `HTTP-JOBS-OWN-*`

## Response notes

Jobs success bodies use `meta.timestamp` as an ISO-8601 string (and optional `meta.warnings`). Full job / schedule shapes live in OpenAPI / Zod (`enrichedJobSchema`).
