# Schedule

Rules for job schedules: when a schedule is valid, how it runs while active, and what is persisted vs observed live.

- **FR-JOBS-SCH-001** — When a schedule is set or changed, its start time shall be in the future.
- **FR-JOBS-SCH-002** — When an end time is set, it shall be after the start time.
- **FR-JOBS-SCH-003** — The system shall support schedule types once, daily, weekly, monthly, and yearly.
- **FR-JOBS-SCH-004** — While a schedule is active, the job shall run on its normal schedule intervals for its type and start time, without an immediate catch-up run when it becomes active after the start time.
- **FR-JOBS-SCH-005** — When a schedule becomes active before its start time, the first run shall be at that start time.
- **FR-JOBS-SCH-006** — A recurring schedule shall not be activated when its end time is now or in the past.
- **FR-JOBS-SCH-007** — When scheduling fails after the job is saved (on create, update, or changing schedule status), the system shall allow the owner to retry scheduling from that job until it succeeds, without recreating the job. Retry is exposed as `POST /api/jobs/retry-schedule/:id` and must not change persisted schedule status (FR-JOBS-SCH-008).
- **FR-JOBS-SCH-008** — Persisted schedule status shall represent the owner’s intent (active or stopped), not whether the runtime currently has the schedule attached.
- **FR-JOBS-SCH-009** — When the runtime stops a schedule because its end time is reached, or when scheduling fails, the system shall not change the persisted schedule status. Those outcomes are operational (FR-JOBS-STR-004), not a change of owner intent.
- **FR-JOBS-SCH-010** — The system shall not change persisted schedule status as a side effect of server restart.
- **FR-JOBS-SCH-011** — When scheduling fails after the job is saved, the runtime shall remain unattached (any half-attached schedule shall be cleared). That outcome shall not be presented as the owner having stopped the schedule (FR-JOBS-SCH-008, FR-JOBS-STR-004).

Changing active vs stopped is in [schedule-status.md](./schedule-status.md). Once-specific rules are in [once.md](./once.md). Operational scheduling outcomes are in [execution](../execution/execution.md) (`FR-JOBS-STR-004`, `FR-JOBS-STR-005`).
