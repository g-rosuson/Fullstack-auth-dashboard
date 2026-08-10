# Client — Job sheet

Route: `/jobs`

Shared form surface for name-adjacent tools and schedule fields. Create/update happy paths stay in [create.md](./create.md) and [update.md](./update.md).

## CLIENT-JOBS-TLR-001 — Open add-tool flow

- Setup: create or edit flow open
- Action: open add tool
- Assert: tool-type choice is available

Traces:
- [FR-JOBS-TLR-002](../../../requirements/fr/jobs/tools/tools.md)

## CLIENT-JOBS-TLR-002 — Persist configured tool

- Setup: create flow open; a supported tool configured with required target(s) and config
- Action: save tool and submit create
- Assert: job appears; after reload, that tool is still present with its config

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-002](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-006](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-007](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)

## CLIENT-JOBS-TLR-006 — Invalid tool blocked in add-tool flow

- Setup: add-tool flow open; tool without a target, or missing required config on the tool/target
- Action: submit tool
- Assert: visible error; add-tool flow remains open; tool is not added to the sheet

Traces:
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-007](../../../requirements/fr/jobs/tools/tools.md)

## CLIENT-JOBS-SCH-001 — Schedule fields required when type selected

- Setup: create or edit flow open; schedule type selected; start date/time missing
- Action: submit
- Assert: visible error; sheet remains open; job not saved with that incomplete schedule

Traces:
- [FR-JOBS-SCH-001](../../../requirements/fr/jobs/schedule/schedule.md)

## CLIENT-JOBS-SCH-002 — Once schedule hides end fields

- Setup: create or edit flow open; schedule section available
- Action: choose schedule type `once`
- Assert: end date and end time controls are not shown

Traces:
- [FR-JOBS-ONCE-001](../../../requirements/fr/jobs/schedule/once.md)

## CLIENT-JOBS-SCH-003 — Past start time rejected

- Setup: create or edit flow open; schedule start in the past
- Action: submit
- Assert: visible schedule error; sheet remains open; job not saved with that start

Traces:
- [FR-JOBS-SCH-001](../../../requirements/fr/jobs/schedule/schedule.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-SCH-004 — End before start rejected

- Setup: create or edit flow open; end time before start time
- Action: submit
- Assert: visible schedule error; sheet remains open; job not saved with that range

Traces:
- [FR-JOBS-SCH-002](../../../requirements/fr/jobs/schedule/schedule.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-SCH-006 — Schedule types available

- Setup: create or edit flow open; schedule section available
- Action: choose schedule type
- Assert: once, daily, weekly, monthly, and yearly are offered

Traces:
- [FR-JOBS-SCH-003](../../../requirements/fr/jobs/schedule/schedule.md)
