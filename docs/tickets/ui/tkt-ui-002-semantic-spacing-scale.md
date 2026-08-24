# TKT-UI-002 — Semantic spacing scale

`chore/tkt-ui-002-semantic-spacing-scale`

Labels: `chore`

## User story

As a frontend contributor, I want a Tailwind semantic spacing scale derived from one `--spacing` primitive so that padding, margin, and gap stay consistent without ad-hoc names or arbitrary values.

## Definition of done

- [ ] Named tokens are `calc(var(--spacing) * n)`: `xs` ×1, `sm` ×2, `md` ×4, `lg` ×6, `xl` ×8
- [ ] Those tokens expose Tailwind’s standard spacing utilities (`p-sm`, `m-md`, `gap-lg`, `px-xl`, `space-y-sm`, and the rest of the spacing families)
- [ ] Spacing in components uses this `xs`–`xl` scale. No parallel names (`s` / `m` / `l`). No arbitrary spacing unless a concrete design requirement needs it
- [ ] Design-system docs (`frontend/src/stylesheets/docs/`) describe the scale, why it is derived from `--spacing`, and when to use the named utilities

## Traces

None — shared UI infrastructure; product flows keep their own FR/CLIENT traces.
