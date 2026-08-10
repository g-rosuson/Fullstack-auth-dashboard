# Update job

Change an existing job.

- **FR-JOBS-UPD-001** — The system shall allow the owner to update a job’s name, tools, and schedule. Renaming remains subject to [FR-JOBS-UNQ-001](./uniqueness.md).
- **FR-JOBS-UPD-002** — The system shall allow the owner to clear a job’s schedule.
- **FR-JOBS-UPD-003** — The system shall reject an update while the job is running.
- **FR-JOBS-UPD-004** — The system shall allow the owner to update a job with a stopped schedule. A stopped schedule shall not run until it is activated (FR-JOBS-SSC-002).
- **FR-JOBS-UPD-005** — Updating a job shall not start a run. The job shall run only on demand ([FR-JOBS-RUN-003](../execution/execution.md)) or when its schedule fires ([FR-JOBS-RUN-001](../execution/execution.md)).

When scheduling fails during an update, the runtime stays unattached (FR-JOBS-SCH-011), retry follows FR-JOBS-SCH-007, and reporting follows FR-JOBS-STR-004 and FR-JOBS-STR-005.
