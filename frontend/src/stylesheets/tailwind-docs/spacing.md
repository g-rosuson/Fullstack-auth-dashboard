# Semantic spacing scale

Layout spacing (padding, margin, gap) uses named tokens derived from one `--spacing` primitive. Change that primitive and both numbered utilities (`p-1`, `gap-4`) and named utilities (`p-xs`, `gap-md`) move together.

## Primitive and tokens

`--spacing` is `0.25rem` in `@theme inline` (`global.css`). Named tokens are multipliers of that value:

| Token | Formula | Value |
|-------|---------|-------|
| `xs` | `calc(var(--spacing) * 1)` | `0.25rem` |
| `sm` | `calc(var(--spacing) * 2)` | `0.5rem` |
| `md` | `calc(var(--spacing) * 4)` | `1rem` |
| `lg` | `calc(var(--spacing) * 6)` | `1.5rem` |
| `xl` | `calc(var(--spacing) * 8)` | `2rem` |

`--spacing-{name}` registers the token on Tailwind’s spacing scale, so every spacing family gets a class: `p-sm`, `px-md`, `m-lg`, `mt-xs`, `gap-xl`, `space-y-sm`, `inset-md`, and the rest.

## What to use

Prefer `xs`–`xl` in app components (`ui-app`, pages, layout). Pick the step that matches the relationship, not a pixel target:

- `xs` — tight: icon-to-label, stacked meta
- `sm` — default between related items
- `md` — section padding, card/sheet inset, medium stacks
- `lg` — between distinct blocks (sheet footer offset)
- `xl` — page-level separation

Do not invent parallel names (`s` / `m` / `l`, `small` / `medium` / `large`) for spacing.

Numbered utilities (`p-1`, `gap-3`) still exist because they also read `--spacing`. Use them only when a value is not on the named scale and a design requires that exact step. Arbitrary values (`p-[13px]`, `gap-[0.37rem]`) only when a concrete design requirement cannot use a token.

Leave shadcn primitives under `components/ui/` unchanged. Apply the named scale in wrappers (`ui-app`) and product UI.
