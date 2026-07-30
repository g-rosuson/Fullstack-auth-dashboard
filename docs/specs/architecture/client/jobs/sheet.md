# Client — Job sheet

Route: `/jobs` (create or edit JobSheet)

Shared form surface for name-adjacent tools and schedule fields. Create/update happy paths stay in [create.md](./create.md) and [update.md](./update.md). List-entry retry lives in [list-entry.md](./list-entry.md) (`CLIENT-JOBS-SCH-005`).

## CLIENT-JOBS-TLR-001 — Open add-tool flow

- Setup: create or edit flow open
- Action: open add tool
- Assert: tool-type choice is available (scraper and email)

Traces:
- [FR-JOBS-TLR-002](../../../requirements/fr/jobs/tools/tools.md)

## CLIENT-JOBS-TLR-002 — Persist scraper tool

- Setup: create flow open; scraper configured with at least one keyword and max-pages
- Action: save tool and submit create
- Assert: job appears; after reload, scraper tool is still present with those inputs

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-002](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)

## CLIENT-JOBS-TLR-004 — Persist email tool

- Setup: create flow open; email tool with subject and body
- Action: save tool and submit create
- Assert: job appears; after reload, email tool still has subject and body

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-002](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)

## CLIENT-JOBS-TLR-006 — Invalid tools blocked

- Setup: create or edit flow open; tools missing, or a tool without a target, or a tool/target with required field(s) empty
- Action: submit create/edit (or submit tool, when the defect is in the tool dialog)
- Assert: visible error; sheet/tool flow remains open; job not saved in that invalid state

Traces:
- [FR-JOBS-TLR-001](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-003](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-004](../../../requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-TLR-005](../../../requirements/fr/jobs/tools/tools.md)
- [HTTP-JOBS-CRT-006](../../http/jobs/create.md)

## CLIENT-JOBS-SCH-001 — Schedule fields required when type selected

- Setup: create or edit flow open; schedule type selected; start date/time missing
- Action: submit
- Assert: visible error; sheet remains open; job not saved with that incomplete schedule

Traces:
- [FR-JOBS-SCH-001](../../../requirements/fr/jobs/schedule/schedule.md)

## CLIENT-JOBS-SCH-002 — Once schedule rejects end time

- Setup: create or edit flow open; schedule type `once`; end time provided
- Action: submit
- Assert: visible error; sheet remains open; job not saved with that schedule

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
