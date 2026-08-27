# HTTP — Jobs stream

`GET /api/jobs/stream-all`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Events are owner-scoped ([FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)).

## HTTP-JOBS-STR-001 — Open stream

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - No body
- Response:
  - Status: `200`
  - Headers: `Content-Type` includes `text/event-stream`; `Cache-Control: no-cache, no-transform`; `Connection: keep-alive`; `X-Accel-Buffering: no`
  - Body: SSE stream (not a JSON envelope)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-STR-002 — Initial jobs-aggregated snapshot

After the stream opens, an event with type `jobs-aggregated` is sent for the requester.

- Assertable payload fields:
  - `type`: `"jobs-aggregated"`
  - `userId`: requester’s user id
  - `runningJobs`: `{ jobId: string, emittedEvents: JobTargetFinishedEvent[] }[]`
  - `scheduledJobs`: `{ jobId: string, status: "idle" | "stopped", nextRun: string | null, lastRun: string | null }[]` (runtime attachments for this user; `nextRun` / `lastRun` are ISO-8601 datetimes or `null`)

Traces:
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-STR-003 — Live scheduled-jobs updates

While connected, when schedule attachment changes for this user, an event with type `scheduled-jobs` is sent.

- Assertable payload fields:
  - `type`: `"scheduled-jobs"`
  - `userId`: requester’s user id
  - `scheduledJobs`: `{ jobId: string, status: "idle" | "stopped", nextRun: string | null, lastRun: string | null }[]` (`nextRun` / `lastRun` are ISO-8601 datetimes or `null`)

Traces:
- [FR-JOBS-STR-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-STR-004 — Live owner-filtered execution events

While connected, the client may receive further SSE events for this user only, including:

- `running-jobs`
- `scheduled-jobs`
- `job-target-finished`
- `job-finished`
- `job-failed`
- `job-cancelled`

(Event field shapes: OpenAPI / Zod job event schemas. `scheduled-jobs` payload fields: HTTP-JOBS-STR-003.)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)
