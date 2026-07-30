# Jobs — Client

Realizes [fr/jobs](../../../requirements/fr/jobs/index.md). Writing rules: [client acceptance](../README.md).  
API scenarios: [http/jobs](../../http/jobs/index.md).

Unauthenticated access to `/jobs` is auth client/E2E territory (redirect to login), not repeated here. Reboot restore is server-only.

## Surface

- Route: `/jobs`
- List hydrates running and schedule state from the jobs stream without a full page reload
- Card chrome (status, primary action, schedule cues): [list-entry.md](./list-entry.md)
- JobSheet (tools + schedule fields): [sheet.md](./sheet.md)

## Files

- [create.md](./create.md) — `CLIENT-JOBS-CRT-*`
- [read.md](./read.md) — `CLIENT-JOBS-LST-*`, `CLIENT-JOBS-GET-*`
- [update.md](./update.md) — `CLIENT-JOBS-UPD-*`
- [delete.md](./delete.md) — `CLIENT-JOBS-DEL-*`
- [uniqueness.md](./uniqueness.md) — `CLIENT-JOBS-UNQ-*`
- [sheet.md](./sheet.md) — `CLIENT-JOBS-TLR-*`, `CLIENT-JOBS-SCH-*` (form)
- [list-entry.md](./list-entry.md) — `CLIENT-JOBS-ENT-*`, `CLIENT-JOBS-RUN-*`, `CLIENT-JOBS-STR-*`, `CLIENT-JOBS-STP-*`, `CLIENT-JOBS-SSC-*`, `CLIENT-JOBS-SCH-005`

## Retired IDs (unused)

Cancel create/edit/delete; `CLIENT-JOBS-CRT-003` (active-only create; covered by `CRT-008`); `CLIENT-JOBS-CRT-005`–`007` and `CLIENT-JOBS-UPD-004` (tool validation; covered by `TLR-006`); `CLIENT-JOBS-TLR-003`, `CLIENT-JOBS-TLR-005` (folded into `TLR-006`).

## E2E mapping

Planned Playwright cases in [jobs-e2e-contract](../../../requirements/todo/jobs-e2e-contract.md). Prefer citing `CLIENT-JOBS-*` in new specs; keep `JOBS-E2E-*` until migrated.

### Listing

- `JOBS-E2E-001` → `CLIENT-JOBS-LST-001`
- `JOBS-E2E-002` → `CLIENT-JOBS-LST-002`
- `JOBS-E2E-003` → `CLIENT-JOBS-LST-003`

### Create

- `JOBS-E2E-010` → `CLIENT-JOBS-CRT-001`
- `JOBS-E2E-011` → `CLIENT-JOBS-CRT-002`
- `JOBS-E2E-012` → `CLIENT-JOBS-CRT-008`
- `JOBS-E2E-014` — retired (cancel create)
- `JOBS-E2E-050` → `CLIENT-JOBS-CRT-004`

### Uniqueness

- `JOBS-E2E-013`, `JOBS-E2E-062` → `CLIENT-JOBS-UNQ-001`
- `JOBS-E2E-033` → `CLIENT-JOBS-UNQ-002`

### Read / detail

- `JOBS-E2E-020` → `CLIENT-JOBS-GET-001`
- `JOBS-E2E-021` → `CLIENT-JOBS-GET-002`
- `JOBS-E2E-022` → `CLIENT-JOBS-GET-003`

### Update

- `JOBS-E2E-030` → `CLIENT-JOBS-UPD-001`
- `JOBS-E2E-031` → `CLIENT-JOBS-UPD-002`
- `JOBS-E2E-032` — retired (cancel edit)
- `JOBS-E2E-034` → `CLIENT-JOBS-UPD-005`
- `JOBS-E2E-083` → `CLIENT-JOBS-UPD-006`

### Delete

- `JOBS-E2E-040` → `CLIENT-JOBS-DEL-001`
- `JOBS-E2E-041` — retired (cancel delete)

### Schedule form

- `JOBS-E2E-051` → `CLIENT-JOBS-SCH-001`
- `JOBS-E2E-052` → `CLIENT-JOBS-SCH-002`
- `JOBS-E2E-060` → `CLIENT-JOBS-SCH-003`
- `JOBS-E2E-061` → `CLIENT-JOBS-SCH-004`

### Tools

- `JOBS-E2E-070` → `CLIENT-JOBS-TLR-001`
- `JOBS-E2E-071` → `CLIENT-JOBS-TLR-002`
- `JOBS-E2E-072` → `CLIENT-JOBS-TLR-006`
- `JOBS-E2E-073` → `CLIENT-JOBS-TLR-004`
- `JOBS-E2E-074` → `CLIENT-JOBS-TLR-006`

### Live updates / list entry

- `JOBS-E2E-080` → `CLIENT-JOBS-STR-001`
- `JOBS-E2E-081` → `CLIENT-JOBS-STR-002`
- `JOBS-E2E-082` → `CLIENT-JOBS-STR-003`
