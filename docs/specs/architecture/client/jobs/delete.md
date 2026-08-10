# Client — Delete job

Route: `/jobs`

## CLIENT-JOBS-DEL-001 — Delete with confirmation

- Setup: owned job on the list; not running
- Action: choose delete → confirm
- Assert: job leaves the list; still absent after reload

Traces:
- [FR-JOBS-DEL-001](../../../requirements/fr/jobs/lifecycle/delete.md)
- [FR-JOBS-DEL-002](../../../requirements/fr/jobs/lifecycle/delete.md)
- [HTTP-JOBS-DEL-001](../../http/jobs/delete.md)

## CLIENT-JOBS-DEL-002 — Delete blocked while running

- Setup: owned job currently running
- Action: choose delete → confirm
- Assert: delete unavailable and a visible error is shown; job remains

Traces:
- [FR-JOBS-DEL-003](../../../requirements/fr/jobs/lifecycle/delete.md)
- [HTTP-JOBS-DEL-002](../../http/jobs/delete.md)
