# Schedule after restart

After a server restart, schedules are restored from persisted owner intent and schedule rules: FR-JOBS-SCH-004, FR-JOBS-SCH-006, [FR-JOBS-ONCE-002](./once.md), FR-JOBS-SCH-008, and FR-JOBS-SCH-010.

- **FR-JOBS-REBOOT-001** — After a server restart, the system shall put a saved scheduled job back on the schedule only when its persisted status is active and the schedule is still allowed to run (including end-time and once-start rules).
- **FR-JOBS-REBOOT-002** — After a server restart, the system shall not put a job back on the schedule when its persisted status is stopped.
- **FR-JOBS-REBOOT-003** — Server restart shall not change persisted schedule status (FR-JOBS-SCH-010).
