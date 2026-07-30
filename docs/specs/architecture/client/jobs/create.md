# Client — Create job

Route: `/jobs`

Shared sheet validation (tools, schedule fields): [sheet.md](./sheet.md). List chrome after create: [list-entry.md](./list-entry.md).

## CLIENT-JOBS-CRT-001 — Open create flow

- Setup: owner on `/jobs`
- Action: open create
- Assert: create flow shows name, tools, schedule, and submit

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)

## CLIENT-JOBS-CRT-002 — Create without schedule

- Setup: create flow open; unique name; valid tool(s); no schedule
- Action: submit create
- Assert: create closes; job appears on the list in a running state

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-CRT-002](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-RUN-001](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-CRT-001](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-004 — Empty name blocked

- Setup: create flow open
- Action: submit create with an empty name
- Assert: visible error; create flow remains open

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)

## CLIENT-JOBS-CRT-008 — Create with active or stopped schedule

- Setup: create flow open; unique name; valid tool(s); schedule with future start; status set to active or stopped
- Action: submit create
- Assert: create closes; job appears with the chosen schedule status; when active, next-run cue is observable; when stopped, job does not run on that schedule until activated

Traces:
- [FR-JOBS-CRT-003](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-CRT-006](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [HTTP-JOBS-CRT-002](../../http/jobs/create.md)
- [HTTP-JOBS-CRT-003](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-009 — Post-save schedule failure visible

- Setup: create saves the job but runtime attach fails
- Action: submit create with an active schedule
- Assert: job remains with intended schedule; failure is visible; retry is available without recreating the job

Traces:
- [FR-JOBS-CRT-005](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-CRT-004](../../http/jobs/create.md)
