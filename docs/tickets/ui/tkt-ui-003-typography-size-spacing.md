# TKT-UI-003 — Decouple typography size and spacing

`chore/tkt-ui-003-typography-size-spacing`

Labels: `chore`

## User story

As a frontend contributor, I want typography size and spacing to be independent so that changing font size does not force a margin, and spacing uses the shared semantic scale.

## Definition of done

- [ ] Audit all typography components (Heading, Text, and anything sharing their CVA) for size variants that include margin, padding, or layout spacing
- [ ] `size` controls only typographic properties (`text-*`, `font-*`, `leading-*`, and similar). No `m-*` / `p-*` / layout spacing in `size`
- [ ] A separate `spacing` variant (`none` / `sm` / `md` / `lg`, …) uses the project’s semantic utilities (`mb-sm`, `mb-md`, …) — depends on [TKT-UI-002](./tkt-ui-002-semantic-spacing-scale.md). No typography-specific spacing values
- [ ] Existing visual defaults are preserved where possible (map today’s size-implied margins onto explicit `spacing` defaults). Heading `removeMargin` becomes `spacing="none"` (or equivalent)
- [ ] Types, CVA variants, defaults, tests, and call sites update together so layout does not change by accident

## Traces

None — shared UI infrastructure; product flows keep their own FR/CLIENT traces.
