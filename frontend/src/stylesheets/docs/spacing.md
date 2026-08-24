# Semantic spacing scale

Layout spacing (padding, margin, gap) uses named tokens derived from one `--spacing` primitive. Change that primitive and both numbered utilities (`p-1`, `gap-4`) and named utilities (`p-xs`, `gap-md`) move together.

## Primitive and tokens

`--spacing` is `0.25rem` in `@theme inline` (`global.css`) and named tokens are multipliers of that value.

`--spacing-{name}` registers the token on Tailwind’s spacing scale, so every spacing family gets a class: `p-sm`, `px-md`, `m-lg`, `mt-xs`, `gap-xl`, `space-y-sm`, `inset-md`, and the rest.

## What to use

Prefer `xs`–`xl` in app components (`ui-app`, pages, layout). Pick the step that matches the relationship, not a pixel target:

- `xs` — tight: icon-to-label, stacked meta
- `sm` — default between related items
- `md` — section padding, card/sheet inset, medium stacks
- `lg` — between distinct blocks (sheet footer offset)
- `xl` — page-level separation

Numbered utilities (`p-1`, `gap-3`) still exist because they also read `--spacing`. Do not use them in app components (`ui-app`, pages, layout) — snap to the nearest named token. Arbitrary values (`p-[13px]`) only when a concrete design requirement cannot use a token. `p-0` / `m-0` / `gap-0` are fine for “none”.

Leave shadcn primitives under `components/ui/` unchanged. Apply the named scale in wrappers (`ui-app`) and product UI.
