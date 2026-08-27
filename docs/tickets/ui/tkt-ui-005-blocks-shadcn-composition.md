# TKT-UI-005 — Refactor app UI into blocks over shadcn

`refactor/tkt-ui-006-blocks-shadcn-composition`

Labels: `refactor`

## User story

As a frontend contributor, I want app-specific UI refactored into `components/blocks`, composed from shadcn, so that style-system tokens have one owner and primitives are not wrapped only to restyle them.

## Composition

- **`components/ui/`** — shadcn primitives. Owned. If stock classes fight the style-system utilities (`p-4` vs `p-md`, and similar), change the primitive and leave a comment on the divergence. Do not add a 1:1 wrap whose only job is `className`
- **`components/blocks/`** — app UI. Compose shadcn (exceptions when no primitive exists or the product *is* the composition). Blocks apply named style-system utilities on the composed surface so consumers do not restyle the same control
- Pages and layout import blocks. They import `ui/` only when a block is not warranted

## Definition of done

- [] App-specific UI lives under `frontend/src/components/blocks/` (move from `ui-app`). Imports, tests, and docs/skills that cite `ui-app` update
- [ ] Blocks are composed from shadcn primitives, with exceptions only when that composition is the product or no primitive exists
- [ ] Token/style conflicts on a single primitive are fixed in `components/ui/` with a comment marking the stock-shadcn change — not a restyle wrapper
- [ ] Blocks overwrite stock shadcn layout/type on the composed surface with style-system utilities (`p-md`, `gap-sm`, `text-sm`, …). Call sites do not patch the same primitive’s defaults
- [ ] Spacing/docs that say “leave shadcn primitives unchanged; restyle in wrappers” match this rule

## Traces

None — shared UI infrastructure; product flows keep their own FR/CLIENT traces.
