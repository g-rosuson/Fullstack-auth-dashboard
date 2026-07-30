# Client — Update job

Route: `/jobs`

Shared sheet validation (tools, schedule fields): [sheet.md](./sheet.md). List chrome after update: [list-entry.md](./list-entry.md).

## CLIENT-JOBS-UPD-001 — Edit name

- Setup: owned job on the list; not running
- Action: open edit → change name to a unique value → submit
- Assert: edit closes; list shows the new name; persists after reload

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-001](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-002 — Clear schedule

- Setup: owned scheduled job; not running
- Action: open edit → clear schedule → submit
- Assert: edit closes; list entry shows no schedule

Traces:
- [FR-JOBS-UPD-002](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-002](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-003 — Empty name blocked

- Setup: edit flow open
- Action: submit edit with an empty name
- Assert: visible error; edit flow remains open

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)

## CLIENT-JOBS-UPD-005 — Update with active or stopped schedule

- Setup: owned job; not running; edit sets a schedule with future start; status active or stopped
- Action: submit edit
- Assert: edit closes; job shows the chosen schedule status; when active, next-run cue is observable; when stopped, job does not run on that schedule until activated

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-004](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [HTTP-JOBS-UPD-001](../../http/jobs/update.md)
- [HTTP-JOBS-UPD-003](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-006 — Edit blocked while running

- Setup: owned job currently running
- Action: submit edit
- Assert: visible error; job unchanged

Traces:
- [FR-JOBS-UPD-003](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-004](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-007 — Post-save schedule failure visible

- Setup: update saves the job but runtime attach fails
- Action: submit edit with an active schedule
- Assert: saved job and intended schedule remain; failure is visible; retry is available without recreating the job

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-UPD-005](../../http/jobs/update.md)
