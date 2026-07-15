# Schedule status

Enable or stop a job’s schedule.

When a schedule is or becomes active, run timing follows FR-JOBS-SCH-004 and FR-JOBS-SCH-005. Activation limits follow FR-JOBS-SCH-006 and [FR-JOBS-ONCE-002](./once.md). Persisted status is owner intent only (FR-JOBS-SCH-008); end-time and scheduling-failure outcomes do not change it (FR-JOBS-SCH-009).

- **FR-JOBS-SSC-001** — The owner shall be able to set a scheduled job’s schedule status to active or stopped.
- **FR-JOBS-SSC-002** — When the schedule is stopped, the job shall not run on that schedule until it is activated again.
- **FR-JOBS-SSC-003** — When a status change succeeds, the owner shall be able to observe the updated schedule status.
- **FR-JOBS-SSC-004** — The system shall reject a status change that requests the status the job already has.
- **FR-JOBS-SSC-005** — The system shall reject a status change when the job has no schedule.
- **FR-JOBS-SSC-006** — The system shall reject a status change while the job is running.

When scheduling fails during a status change, the runtime stays unattached (FR-JOBS-SCH-011), retry follows FR-JOBS-SCH-007, and reporting follows FR-JOBS-STR-004 and FR-JOBS-STR-005.
