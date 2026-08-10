# Stop in-flight run

Owner-requested cancellation of a running job. Distinct from schedule status `stopped` (FR-JOBS-SSC-*), which changes schedule intent and does not cancel an active run.

- **FR-JOBS-STP-001** — The system shall allow the owner to request cancellation of an in-flight job run.
- **FR-JOBS-STP-002** — The system shall reject a stop request when the job is not running for that owner.
- **FR-JOBS-STP-003** — When cancellation is requested, the system shall not start subsequent tools in the run and shall signal in-flight tools/targets to stop cooperative work.
- **FR-JOBS-STP-004** — The system shall record a cancelled execution so the owner can see that the run was cancelled, including any tools that completed before cancellation.
