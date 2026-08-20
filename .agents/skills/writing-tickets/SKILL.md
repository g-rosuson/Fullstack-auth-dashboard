---
name: writing-tickets
description: >-
  Create and edit markdown tickets under docs/tickets. Covers ID
  allocation, labels, user story, definition of done, Traces, and
  file layout. Use when adding or editing a ticket, user story, or
  work slice, or when the user asks to write a TKT-* item.
---

# Purpose

Turn a work idea into a concise ticket that slices the SRS — not a status board.

Canonical rules: [`docs/tickets/README.md`](../../../docs/tickets/README.md).  
For FR / HTTP / CLIENT IDs and where behavior belongs, use [writing-docs](../writing-docs/SKILL.md).

# When To Use

- Creating or editing files under `docs/tickets/`
- User asks for a ticket, user story, DoD, or `TKT-*` work item

# Workflow

1. **Domain** — lowercase folder matching the work (`ui`, `jobs`, `auth`, …). Create the folder if missing; add a link under Domains in the tickets README.
2. **Next ID** — scan `docs/tickets/<domain>/` for the highest `TKT-<DOMAIN>-###`; use next free number. Never renumber. Retired IDs stay unused.
3. **Label** — one purpose label (see below).
4. **Write** — one file: `docs/tickets/<domain>/tkt-<domain>-###-<slug>.md`.
5. **Traces** — product-facing tickets link ≥1 FR (relative path). HTTP/CLIENT when the slice touches those surfaces. Shared infra may use `None` with a one-line reason.

# ID and file

- ID: `TKT-<DOMAIN>-###` — e.g. `TKT-UI-001`
- Filename: `tkt-<domain>-###-<short-kebab-slug>.md`
- Branch (optional): `feat|fix|chore/tkt-<domain>-###-<slug>`

# Labels

| Label | Use |
|-------|-----|
| `feature` | New or extended product behavior |
| `fix` | Correct broken behavior |
| `chore` | Non-user-facing / shared infrastructure |
| `docs` | Specs or guides only |
| `spike` | Time-boxed investigation |

# Shape

```markdown
# TKT-<DOMAIN>-### — Short title

Labels: `feature`

## User story

As a …, I want … so that ….

## Definition of done

- [ ] …
- [ ] …

## Traces

- [FR-…](../../specs/requirements/…)
```

- **User story** — one short As a / I want / so that (or equivalent)
- **DoD** — checklist for this slice; link acceptance scenarios instead of rewriting them
- **Traces** — relative links; see writing-docs for ID rules
- No status, assignees, or estimates

# Do not

- Track open/done in the ticket body
- Duplicate FR/HTTP/CLIENT acceptance prose in DoD
- Invent or reuse ID numbers out of sequence
- Put tickets inside `docs/specs/`
