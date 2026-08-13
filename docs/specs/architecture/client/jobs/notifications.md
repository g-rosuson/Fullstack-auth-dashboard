# Client — Jobs notifications

Route: `/jobs`

Toasts for mutation results and interrupting stream outcomes. They complement list/detail updates; they do not replace [CLIENT-JOBS-STR-001](./list-entry.md), [CLIENT-JOBS-STR-003](./list-entry.md), or [CLIENT-JOBS-STR-004](./list-entry.md).

## CLIENT-JOBS-NTF-001 — Success toast after mutation

- Setup: owner on `/jobs`
- Action: complete create, update, delete, run, stop, pause, activate, or retry-schedule
- Assert: a success toast is shown; list/detail still update per the matching CLIENT action scenario

Traces:
- [FR-JOBS-CRT-001](../../../requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-UPD-001](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-DEL-001](../../../requirements/fr/jobs/lifecycle/delete.md)
- [FR-JOBS-RUN-003](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STP-001](../../../requirements/fr/jobs/execution/stop.md)
- [FR-JOBS-SSC-001](../../../requirements/fr/jobs/schedule/schedule-status.md)
- [FR-JOBS-SCH-007](../../../requirements/fr/jobs/schedule/schedule.md)

## CLIENT-JOBS-NTF-002 — Error toast after failed mutation

- Setup: owner on `/jobs`; the mutation will be rejected
- Action: attempt create, update, delete, run, stop, pause, activate, or retry-schedule
- Assert: an error toast is shown; the failed change is not applied

Traces:
- [FR-JOBS-UPD-003](../../../requirements/fr/jobs/lifecycle/update.md)
- [FR-JOBS-DEL-003](../../../requirements/fr/jobs/lifecycle/delete.md)
- [FR-JOBS-RUN-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STP-002](../../../requirements/fr/jobs/execution/stop.md)
- [FR-JOBS-UNQ-001](../../../requirements/fr/jobs/lifecycle/uniqueness.md)

## CLIENT-JOBS-NTF-003 — Toast when a target or run finishes, fails, or is cancelled

- Setup: owner on `/jobs` with stream connected; a run is in progress
- Action: wait until a target finishes, or until the run finishes, fails, or is cancelled
- Assert: a toast is shown (info for a finished target; success, error, or warning for the run); list/detail still update per [CLIENT-JOBS-STR-003](./list-entry.md)

Traces:
- [FR-JOBS-STR-001](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-RUN-002](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STP-001](../../../requirements/fr/jobs/execution/stop.md)
- [HTTP-JOBS-STR-004](../../http/jobs/stream.md)

## CLIENT-JOBS-NTF-004 — Toast when scheduling fails

- Setup: owner on `/jobs`; scheduling fails after save, or a previously attached active schedule detaches while the stream is connected
- Action: observe the page (no full reload required)
- Assert: a warning toast is shown; the failure remains visible on the list per [CLIENT-JOBS-STR-004](./list-entry.md)

Traces:
- [FR-JOBS-STR-004](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-005](../../../requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-CRT-005](../../../requirements/fr/jobs/lifecycle/create.md)
- [HTTP-JOBS-CRT-004](../../http/jobs/create.md)
