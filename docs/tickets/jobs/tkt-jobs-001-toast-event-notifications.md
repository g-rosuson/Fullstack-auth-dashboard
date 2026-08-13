# TKT-JOBS-001 — Jobs toast event notifications

Labels: `feature`

## User story

As a job owner, I want toast notifications for important jobs events so that I notice successes, failures, and key stream outcomes without watching the list constantly.

## Definition of done

- [ ] Jobs module uses `toast` from [`ui-app/toast`](../../../frontend/src/components/ui-app/toast/Toast.tsx) (depends on [TKT-UI-001](../ui/tkt-ui-001-shadcn-toast.md))
- [ ] Mutation outcomes (create / update / delete / run / stop / schedule status / retry-schedule) surface success or error toasts with the correct type
- [ ] Stream / operational outcomes that should interrupt the owner (e.g. job finished, failed, cancelled; scheduling failure per FR-JOBS-STR-004) show an appropriate toast
- [ ] Toasts do not replace list/detail UI updates already covered by CLIENT stream scenarios — they complement them
- [ ] No leftover `console.log` / `console.error` as the only user-facing signal for those paths

## Traces

- [FR-JOBS-STR-001](../../specs/requirements/fr/jobs/execution/execution.md)
- [FR-JOBS-STR-004](../../specs/requirements/fr/jobs/execution/execution.md)
- [CLIENT-JOBS-STR-001](../../specs/architecture/client/jobs/list-entry.md)
- [CLIENT-JOBS-STR-003](../../specs/architecture/client/jobs/list-entry.md)
- [CLIENT-JOBS-STR-004](../../specs/architecture/client/jobs/list-entry.md)
