# Client — Update job

Route: `/jobs`

Shared sheet validation (tools, schedule fields): [sheet.md](./sheet.md). List chrome after update: [list-entry.md](./list-entry.md).

## CLIENT-JOBS-UPD-001 — Edit name

- Setup: owned job on the list; not running
- Action: open edit → change name to a unique value → submit
- Assert: edit closes; list shows the new name; persists after reload; job is not **Running**

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-001](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-002 — Clear schedule

- Setup: owned scheduled job; not running
- Action: open edit → clear schedule → submit
- Assert: edit closes; list entry shows no schedule; job is not **Running**

Traces:
- [FR-JOBS-UPD-002](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-002](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-003 — Empty name blocked

- Setup: edit flow open
- Action: submit edit with an empty name
- Assert: visible error; edit flow remains open

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)

## CLIENT-JOBS-UPD-004 — No tools blocked

- Setup: edit flow open; tools removed
- Action: submit edit
- Assert: visible error; edit flow remains open

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-UPD-007](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-005 — Tool without target blocked

- Setup: edit flow open; a tool with no target
- Action: submit edit (or submit tool)
- Assert: visible error; edit/tool flow remains open

Traces:
- [FR-JOBS-TLR-007](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-UPD-007](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-006 — Required tool or target config blocked

- Setup: edit flow open; a tool or target is missing required config (tool-level config applies to targets that omit it; a target may set its own)
- Action: submit edit (or submit tool)
- Assert: visible error; edit/tool flow remains open

Traces:
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-UPD-007](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-007 — Update with active schedule

- Setup: owned job; not running; edit sets a valid schedule with future start; status active
- Action: submit edit
- Assert: edit closes; job shows status **Active**; next-run cue is observable; job is not **Running**

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-001](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-008 — Update with stopped schedule

- Setup: owned job; not running; edit sets a valid schedule with future start; status stopped
- Action: submit edit
- Assert: edit closes; job shows status **Paused**; job does not run on that schedule until activated; job is not **Running**

Traces:
- [FR-JOBS-UPD-004](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-UPD-005](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-SSC-002](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [HTTP-JOBS-UPD-003](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-009 — Edit blocked while running

- Setup: owned job currently running
- Action: submit edit
- Assert: edit unavailable and a visible error is shown; job unchanged

Traces:
- [FR-JOBS-UPD-003](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-004](../../http/jobs/update.md)

## CLIENT-JOBS-UPD-010 — Post-save schedule failure visible

- Setup: update saves the job but runtime attach fails
- Action: submit edit with an active schedule
- Assert: saved job and intended schedule remain; failure is visible; retry is available without recreating the job

Traces:
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-UPD-005](../../http/jobs/update.md)
