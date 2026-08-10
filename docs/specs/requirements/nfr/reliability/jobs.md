# Jobs reliability

How well job execution and cancellation behave under interruption. Functional stop behavior is under `fr/jobs/execution/stop.md`.

- **NFR-REL-JOBS-001** — A stop request shall complete without waiting for in-flight tools or targets to finish; cancellation of work shall proceed asynchronously after the request is accepted.
- **NFR-REL-JOBS-002** — When cancellation is signaled, tools and targets that honor the abort signal shall release cooperative resources (for example Playwright browser sessions) without requiring a process restart.
