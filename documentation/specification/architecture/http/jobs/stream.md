# HTTP — Jobs stream

`GET /api/jobs/stream-all`

Auth: [HTTP-AUTH-TOK-003](../auth/session.md). Events are owner-scoped ([FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)).

## HTTP-JOBS-STR-001 — Open stream

- Request:
  - Header: `Authorization: Bearer <access-token>`
  - No body
- Response:
  - Status: `200`
  - Headers: `Content-Type` includes `text/event-stream`; `Cache-Control: no-cache`; `Connection: keep-alive`
  - Body: SSE stream (not a JSON envelope)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)

## HTTP-JOBS-STR-002 — Initial running-jobs snapshot

After the stream opens, an event with type `running-jobs` is sent for the requester.

- Assertable payload fields:
  - `type`: `"running-jobs"`
  - `runningJobs`: `string[]` (job ids currently running for this user)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-STR-003 — Initial scheduled-jobs snapshot

After the stream opens, an event with type `scheduled-jobs` is sent for the requester.

- Assertable payload fields:
  - `type`: `"scheduled-jobs"`
  - `userId`: requester’s user id
  - `scheduledJobs`: `{ jobId: string, status: "idle" | "stopped" }[]` (runtime attachments for this user)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

## HTTP-JOBS-STR-004 — Live owner-filtered events

While connected, the client may receive further SSE events for this user only, including:

- `running-jobs`
- `scheduled-jobs`
- `job-target-finished`
- `job-finished`
- `job-failed`
- `job-cancelled`

(Event field shapes: OpenAPI / Zod job event schemas.)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-006](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-OWN-002](../../../requirements/fr/jobs/ownership/ownership.md)
