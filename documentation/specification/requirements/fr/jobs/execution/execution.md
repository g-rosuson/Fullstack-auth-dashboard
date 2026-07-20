# Execution and live updates

Running jobs and streaming progress. Who may receive stream events is FR-JOBS-OWN-002.

- **FR-JOBS-RUN-001** — The system shall execute a job’s tools when the job is run (on create without a schedule, on demand, or when the schedule fires).
- **FR-JOBS-RUN-002** — The system shall record executions so the owner can see outcomes for a job.
- **FR-JOBS-RUN-003** — The system shall allow the owner to manually start running a job’s tools from the job card (or equivalent list entry) without opening edit.
- **FR-JOBS-RUN-004** — The system shall reject starting a run while the job is already running.
- **FR-JOBS-STR-001** — The system shall provide a live stream of job activity (which jobs are running; when targets finish; when a job finishes, fails, or is cancelled per FR-JOBS-STP-001) so the owner can observe updates without a full page reload.
- **FR-JOBS-STR-002** — On stream connect, the system shall send a single aggregated initial snapshot of the owner’s running jobs (each with any in-flight target-finished events already emitted for that run) and scheduled jobs (each with its runtime schedule status), so the client can hydrate running and schedule UI state without waiting for multiple stream events.
- **FR-JOBS-STR-004** — When scheduling fails or the runtime is no longer running a schedule that the owner still intends to be active, the system shall make that operational outcome observable to the owner (via the live stream and/or the response to the triggering action) so the owner can retry scheduling (FR-JOBS-SCH-007).
- **FR-JOBS-STR-005** — That operational outcome shall remain observable when the owner later lists or opens the job (not only on the response to the action that failed), until scheduling succeeds or the owner clears or stops the schedule (FR-JOBS-SCH-007, FR-JOBS-SCH-011).
