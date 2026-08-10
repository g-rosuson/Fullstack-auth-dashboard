# Create job

Create a job with or without a schedule.

- **FR-JOBS-CRT-001** — The system shall allow a user to create a job with a schedule or without one.
- **FR-JOBS-CRT-002** — When a job is created without a schedule, the system shall start running that job’s tools immediately after it is saved.
- **FR-JOBS-CRT-003** — When a job is created with an active schedule, the system shall save the job and place that schedule in an active state (FR-JOBS-SCH-004, FR-JOBS-SCH-005).
- **FR-JOBS-CRT-004** — If saving the job fails, the system shall not start scheduling or running it.
- **FR-JOBS-CRT-005** — If the job is saved but scheduling or starting it fails afterward, the system shall keep the saved job and its intended schedule, leave the runtime unattached (FR-JOBS-SCH-011), report the failure to the user (FR-JOBS-STR-004, FR-JOBS-STR-005), and allow retry per FR-JOBS-SCH-007.
- **FR-JOBS-CRT-006** — The system shall allow a user to create a job with a stopped schedule. A stopped schedule shall not run until it is activated (FR-JOBS-SSC-002).

Name uniqueness on create: [FR-JOBS-UNQ-001](./uniqueness.md).
