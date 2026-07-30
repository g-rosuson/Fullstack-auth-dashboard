---
name: writing-docs
description: >-
  Write and maintain product docs in docs/specs and
  docs/guides/software-docs. Covers FR/NFR, HTTP acceptance, client
  acceptance, IDs, prose style, and traceability. Use when adding or editing
  requirements, architecture acceptance, SRS guides, or when the user asks how
  to document a feature.
---

# Purpose

Keep product docs concise, precise, and readable — correct layer, stable IDs, no implementation leakage into FRs.

# When To Use

- Adding or editing files under `docs/specs/`
- Writing FR/NFR, HTTP acceptance, or client acceptance
- Updating software-docs guides for requirements or the doc stack
- Deciding where a behavior belongs (FR vs HTTP vs client)

# Doc stack

```text
FR / NFR  →  Architecture acceptance (HTTP, Client)  →  Implementation  →  Tests
```

- **FR / NFR** — `docs/specs/requirements/` — what / how well
- **HTTP** — `docs/specs/architecture/http/` — API scenarios
- **Client** — `docs/specs/architecture/client/` — UI scenarios
- **Guides** — `docs/guides/software-docs/` — how the stack works

Change control: **FR/NFR first → acceptance → tests and implementation.**

Canonical detail: layer READMEs under those paths; traceability in `docs/guides/software-docs/software-requirements-specification.md`.

# Choose the layer

- **FR** — Observable product behavior. No routes, status codes, cookies, storage APIs, or component names.
- **NFR** — Measurable quality (security, timing, limits).
- **HTTP** — Assertable request/response (and cookies) for an API. Cite FRs. No “shall”.
- **Client** — Assertable UI: setup → action → outcome. Cite FRs (and `HTTP-*` when the UI depends on an API outcome). No “shall”.
- Views, redirects, client lifecycle → client acceptance, not HTTP.

# Identifiers

- FR: `FR-<DOMAIN>-<CAPABILITY>-###` — e.g. `FR-JOBS-CRT-001`
- NFR: `NFR-<ATTR>-<DOMAIN>-###` — e.g. `NFR-SEC-AUTH-001`
- HTTP: `HTTP-<DOMAIN>-<CAPABILITY>-###`
- Client: `CLIENT-<DOMAIN>-<CAPABILITY>-###`

Per capability (or NFR attribute+domain) sequence. Next free number only. Never renumber. Retired IDs stay unused. No `FR-HTTP-*` or flat `FR-001`.

Every HTTP/client scenario cites ≥1 FR.

# Writing style

- Short prose. Section titles over tables for indexes and maps.
- **Requirements:** bullet lists; **Shall** (mandatory), Should, May, Shall not. **No tables** in requirement documents.
- **Acceptance:** scenario headings with ID + short title; setup / action / assert (client) or request / response (HTTP).
- One concern per file (mirror `fr/<domain>/` capabilities). Domain `index.md` = surface + links to files only; do not repeat layer rules there.
- Pin only what tests assert. Full schemas → OpenAPI / Zod.
- Prefer readable scanning: titled sections, short bullets, no filler.

# FR quality bar

Atomic, unambiguous, testable, measurable. One behavior per ID.

```markdown
- **FR-JOBS-CRT-001** — The system shall allow a user to create a job with a schedule or without one.
```

# Acceptance shape

**HTTP** — route at top; then:

```markdown
## HTTP-JOBS-CRT-001 — Create without schedule

- Request: …
- Response: status + assertable body/cookie fields

Traces:
- FR-…
```

**Client** — surface/route at top; then:

```markdown
## CLIENT-JOBS-CRT-002 — Create without schedule

- Setup: …
- Action: …
- Assert: …

Traces:
- FR-…
- HTTP-…   # optional
```

# Do not

- Put implementation or HTTP details in FRs
- Restate domain intent in acceptance (“shall”)
- Duplicate OpenAPI/Zod schemas in acceptance docs
- Invent ID sequences or renumber
- Use tables in `requirements/` documents
- Bloat index files with repeated rules from the layer README
