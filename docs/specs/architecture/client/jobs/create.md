# Client — Create job

Route: `/jobs`

Shared sheet validation (tools, schedule fields): [sheet.md](./sheet.md).

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

## CLIENT-JOBS-CRT-003 — Empty name blocked

- Setup: create flow open
- Action: submit create with an empty name
- Assert: visible error; create flow remains open

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)

## CLIENT-JOBS-CRT-004 — No tools blocked

- Setup: create flow open; unique name; no tools
- Action: submit create
- Assert: visible error; create flow remains open

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-005 — Tool without target blocked

- Setup: create flow open; unique name; a tool with no target
- Action: submit create (or submit tool)
- Assert: visible error; create/tool flow remains open

Traces:
- [FR-JOBS-TLR-007](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-006 — Required tool or target config blocked

- Setup: create flow open; unique name; a tool or target is missing required config (tool-level config applies to targets that omit it; a target may set its own)
- Action: submit create (or submit tool)
- Assert: visible error; create/tool flow remains open

Traces:
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-007 — Create with active schedule

- Setup: create flow open; unique name; valid tool(s); schedule with future start; status active
- Action: submit create
- Assert: create closes; job appears with status **Active**; next-run cue is observable

Traces:
- [FR-JOBS-CRT-003](../../../requirements/fr/jobs/lifecycle/create.md)
- [HTTP-JOBS-CRT-002](../../http/jobs/create.md)

## CLIENT-JOBS-CRT-008 — Create with stopped schedule

- Setup: create flow open; unique name; valid tool(s); schedule with future start; status stopped
- Action: submit create
- Assert: create closes; job appears with status **Paused**; job does not run on that schedule until activated

Traces:
- [FR-JOBS-CRT-006](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
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
