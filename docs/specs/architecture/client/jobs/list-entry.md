# Client — List entry

Route: `/jobs`

Card and detail chrome on the list: status badge, primary action, schedule cues, and list actions.

## Presentation

Observational — setup state, view list (stream hydrated), assert badge + primary action + cues.

### CLIENT-JOBS-ENT-001 — Running entry

- Setup: owned job currently running
- Action: view list entry
- Assert: status **Running**; primary action **Stop**

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STP-001](../../../requirements/fr/jobs/execution/stop.md)

### CLIENT-JOBS-ENT-002 — No schedule

- Setup: owned job with no schedule; not running
- Action: view list entry
- Assert: status **Inactive**; primary action **Run**; last-run from executions when present

Traces:
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-003 — Once active before start

- Setup: owned once schedule; start in the future; status active; not running
- Action: view list entry
- Assert: status **Active**; primary action **Pause**; next-run shows start

Traces:
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-004 — Once stopped before start

- Setup: owned once schedule; start in the future; status stopped; not running
- Action: view list entry
- Assert: status **Paused**; primary action **Activate**; next-run shows start

Traces:
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-005 — Once after start

- Setup: owned once schedule; start has passed; not running
- Action: view list entry
- Assert: status **Inactive**; primary action **Run**

Traces:
- [FR-JOBS-ONCE-003](../../../requirements/fr/jobs/schedule/once.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-006 — Recurring active attached

- Setup: owned recurring schedule; stream attached; status active; window open; not running
- Action: view list entry
- Assert: status **Active**; primary action **Pause**; next-run and last-run from stream when applicable

Traces:
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-003](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-007 — Recurring stopped attached

- Setup: owned recurring schedule; stream attached; status stopped; window open; not running
- Action: view list entry
- Assert: status **Paused**; primary action **Activate**; next-run and last-run from stream when applicable

Traces:
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-008 — Recurring missing stream

- Setup: owned recurring schedule persisted; no matching stream entry; window open; not running
- Action: view list entry
- Assert: status **Missing**; primary action **Reschedule**

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-011](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-ENT-009 — Recurring past end

- Setup: owned recurring schedule; end in the past; not running
- Action: view list entry
- Assert: status **Inactive**; primary action **Run**

Traces:
- [FR-JOBS-SCH-009](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-SCH-012](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)

## Actions

### CLIENT-JOBS-RUN-001 — Run from list entry

- Setup: owned job that is not running; list visible
- Action: start a run from the list entry
- Assert: entry shows **Running**

Traces:
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-RUN-001](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-RUN-001](../../http/jobs/run.md)

### CLIENT-JOBS-RUN-002 — Run unavailable while already running

- Setup: owned job currently running
- Action: view list entry
- Assert: start (Run) unavailable; primary action is **Stop**; still a single in-flight run

Traces:
- [FR-JOBS-RUN-004](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-RUN-002](../../http/jobs/run.md)

### CLIENT-JOBS-RUN-003 — On-demand run when once start has passed

- Setup: owned once-scheduled job; start has passed; not running
- Action: start a run from the list entry
- Assert: run starts; owner is not forced to recreate the job

Traces:
- [FR-JOBS-ONCE-003](../../../requirements/fr/jobs/schedule/once.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-RUN-001](../../http/jobs/run.md)

### CLIENT-JOBS-RUN-004 — On-demand run when recurring end has passed

- Setup: owned recurring-scheduled job; end has passed; not running
- Action: start a run from the list entry
- Assert: run starts; owner is not forced to recreate the job

Traces:
- [FR-JOBS-SCH-012](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-RUN-001](../../http/jobs/run.md)

### CLIENT-JOBS-STP-001 — Stop a running job

- Setup: owned job currently running; list or detail visible
- Action: request stop
- Assert: stop accepted; **Running** clears when cancellation completes; cancelled execution visible in detail

Traces:
- [FR-JOBS-STP-001](../../../requirements/fr/jobs/execution/stop.md)
- [FR-JOBS-STP-004](../../../requirements/fr/jobs/execution/stop.md)
- [HTTP-JOBS-STP-001](../../http/jobs/stop.md)

### CLIENT-JOBS-SSC-001 — Pause an active schedule

- Setup: owned scheduled job with active intent; not running
- Action: pause schedule
- Assert: entry shows **Paused**; job does not run on that schedule until activated

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [HTTP-JOBS-SSC-001](../../http/jobs/schedule-status.md)

### CLIENT-JOBS-SSC-002 — Activate a stopped schedule

- Setup: owned scheduled job with stopped intent; schedule still activatable; not running
- Action: activate schedule
- Assert: entry shows **Active**; next-run observable when the runtime attaches

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SSC-003](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [HTTP-JOBS-SSC-002](../../http/jobs/schedule-status.md)

### CLIENT-JOBS-SSC-003 — Status change unavailable while running

- Setup: owned scheduled job currently running
- Action: view list entry
- Assert: schedule status change unavailable; primary action is **Stop**; status unchanged

Traces:
- [FR-JOBS-SSC-006](../../../requirements/fr/jobs/schedule/schedule-status.md)

### CLIENT-JOBS-SSC-004 — Scheduling failure on status change visible

- Setup: status change persists intent but runtime attach fails
- Action: activate (or otherwise change) schedule status
- Assert: persisted intent remains; failure visible; retry available (`CLIENT-JOBS-SCH-005`)

Traces:
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)

### CLIENT-JOBS-SCH-005 — Retry scheduling from the job

- Setup: owned job whose schedule intent is saved but runtime is unattached after a scheduling failure
- Action: reschedule / retry from the list entry
- Assert: on success, schedule cues update (e.g. next-run) and persisted intent is unchanged; on failure, failure remains visible

Traces:
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-RTY-001](../../http/jobs/retry-schedule.md)

## Live updates

### CLIENT-JOBS-STR-001 — Running state without full reload

- Setup: owner on `/jobs` with stream connected; a run is in progress or starts
- Action: observe the list (no full page reload)
- Assert: **Running** updates on the affected entry

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-STR-001](../../http/jobs/stream.md)
- [HTTP-JOBS-STR-004](../../http/jobs/stream.md)

### CLIENT-JOBS-STR-002 — Hydrate running and schedule state on connect

- Setup: owner has running and/or scheduled jobs; navigate to `/jobs` (or reconnect stream)
- Action: wait for initial stream snapshot
- Assert: list reflects current running jobs and schedule cues without a manual refresh

Traces:
- [FR-JOBS-STR-002](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-STR-002](../../http/jobs/stream.md)

### CLIENT-JOBS-STR-003 — Run finished updates list and detail

- Setup: owned job was running; stream connected
- Action: wait until the run finishes (success, failure, or cancel)
- Assert: **Running** clears; last-run updates; opening detail shows the execution recorded

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-RUN-002](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STP-004](../../../requirements/fr/jobs/execution/stop.md)

### CLIENT-JOBS-STR-004 — Scheduling operational failure remains visible
- Setup: scheduling failed after save; owner may navigate away and return to `/jobs` or reopen the job
- Action: view the job on the list or in detail
- Assert: failure remains observable until scheduling succeeds or the owner clears/stops the schedule

Traces:
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)
