# Client — Read jobs

Route: `/jobs`

## CLIENT-JOBS-LST-001 — Loading state

- Setup: authenticated owner
- Action: navigate to `/jobs`
- Assert: while loading, a loading indicator is shown; the list create control is not shown

Traces:
- [FR-JOBS-LST-001](../../../requirements/fr/jobs/lifecycle/read.md)

## CLIENT-JOBS-LST-002 — Empty list placeholder

- Setup: authenticated owner with no jobs
- Action: navigate to `/jobs` and wait for load
- Assert: placeholder is shown with a create-job control; list create control is not shown; opening create from the placeholder opens the create flow

Traces:
- [FR-JOBS-LST-001](../../../requirements/fr/jobs/lifecycle/read.md)
- [HTTP-JOBS-LST-001](../../http/jobs/read.md)

## CLIENT-JOBS-LST-003 — Owner’s jobs only

- Setup: authenticated owner who has at least one job
- Action: view the jobs list
- Assert: only this owner’s jobs appear

Traces:
- [FR-JOBS-LST-001](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-OWN-001](../../../requirements/fr/jobs/ownership/ownership.md)

## CLIENT-JOBS-GET-001 — Open detail from list entry

- Setup: at least one job on the list
- Action: open the job from its list entry
- Assert: detail shows the job name and an executions area

Traces:
- [FR-JOBS-GET-001](../../../requirements/fr/jobs/lifecycle/read.md)
- [FR-JOBS-RUN-002](../../../requirements/fr/jobs/execution/execution.md)
- [HTTP-JOBS-GET-001](../../http/jobs/read.md)

## CLIENT-JOBS-GET-002 — Open detail from entry menu

- Setup: at least one job on the list with an entry menu
- Action: choose open from the menu
- Assert: same detail as CLIENT-JOBS-GET-001

Traces:
- [FR-JOBS-GET-001](../../../requirements/fr/jobs/lifecycle/read.md)

## CLIENT-JOBS-GET-003 — Close detail

- Setup: job detail open
- Action: close detail
- Assert: list is visible; the job entry remains

Traces:
- [FR-JOBS-LST-001](../../../requirements/fr/jobs/lifecycle/read.md)
