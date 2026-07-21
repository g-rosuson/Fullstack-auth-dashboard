# Ownership

Who may access and change jobs.

- **FR-JOBS-OWN-001** — Every job shall belong to the user who created it; only that owner shall list, read, create under their account, update, delete, stop an in-flight run, change schedule status, or receive stream events for it.
- **FR-JOBS-OWN-002** — A request for another user’s job shall fail without granting access, and shall be indistinguishable from a request for a job that does not exist.
