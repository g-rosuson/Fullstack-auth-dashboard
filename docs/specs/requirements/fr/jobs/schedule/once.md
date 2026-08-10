# One-time jobs

Rules that apply only to `once` schedules. Shared schedule rules (types, start/end ordering, active-run timing, persistence) are in [schedule.md](./schedule.md).

- **FR-JOBS-ONCE-001** — A once schedule shall not have an end time.
- **FR-JOBS-ONCE-002** — A once schedule shall not be activated when its start time is now or in the past.
- **FR-JOBS-ONCE-003** — When a once schedule cannot be activated because its start time has passed, the system shall still allow the owner to run the job on demand ([FR-JOBS-RUN-003](../execution/execution.md)).
