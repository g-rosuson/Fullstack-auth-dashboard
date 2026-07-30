# Client — Name uniqueness

Route: `/jobs`

## CLIENT-JOBS-UNQ-001 — Duplicate name on create

- Setup: owner already has a job named `Alpha`
- Action: create another job named `Alpha`
- Assert: visible error; create flow remains open; still only one `Alpha` on the list

Traces:
- [FR-JOBS-UNQ-001](../../../requirements/fr/jobs/lifecycle/uniqueness.md)
- [HTTP-JOBS-CRT-005](../../http/jobs/create.md)

## CLIENT-JOBS-UNQ-002 — Duplicate name on rename

- Setup: owner has jobs `Alpha` and `Beta`
- Action: rename `Beta` to `Alpha`
- Assert: visible error; list entry for `Beta` still shows `Beta`

Traces:
- [FR-JOBS-UNQ-001](../../../requirements/fr/jobs/lifecycle/uniqueness.md)
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [HTTP-JOBS-UPD-006](../../http/jobs/update.md)
