# Jobs — Client

Realizes [fr/jobs](../../../requirements/fr/jobs/index.md). Writing rules: [client acceptance](../README.md).  
API scenarios: [http/jobs](../../http/jobs/index.md).

Unauthenticated access to `/jobs`: [CLIENT-AUTH-ACL-001](../auth/access-control.md). Owner-only list coverage: [read.md](./read.md) (`CLIENT-JOBS-LST-003`).

## Surface

- Route: `/jobs`
- List hydrates running and schedule state from the jobs stream without a full page reload
- Card chrome: [list-entry.md](./list-entry.md)
- Job sheet (tools + schedule fields): [sheet.md](./sheet.md)
- Toasts for mutations and interrupting stream outcomes: [notifications.md](./notifications.md)

## Files

- [create.md](./create.md) — `CLIENT-JOBS-CRT-*`
- [read.md](./read.md) — `CLIENT-JOBS-LST-*`, `CLIENT-JOBS-GET-*`
- [update.md](./update.md) — `CLIENT-JOBS-UPD-*`
- [delete.md](./delete.md) — `CLIENT-JOBS-DEL-*`
- [uniqueness.md](./uniqueness.md) — `CLIENT-JOBS-UNQ-*`
- [sheet.md](./sheet.md) — `CLIENT-JOBS-TLR-*`, `CLIENT-JOBS-SCH-*` (form)
- [list-entry.md](./list-entry.md) — `CLIENT-JOBS-ENT-*`, `CLIENT-JOBS-RUN-*`, `CLIENT-JOBS-STR-*`, `CLIENT-JOBS-STP-*`, `CLIENT-JOBS-SSC-*`, `CLIENT-JOBS-SCH-005`
- [notifications.md](./notifications.md) — `CLIENT-JOBS-NTF-*`
