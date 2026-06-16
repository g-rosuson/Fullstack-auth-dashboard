# `@theme` namespaces → utilities

Design tokens live in `global.css`. Tailwind v4 reads them from `@theme inline` and generates utility classes. Components use those classes, not raw `var(--…)` names.

In Tailwind v4, the **prefix** on a `@theme` variable decides which utility classes exist. The token name after the prefix becomes the class suffix: `--color-primary` → `bg-primary`, `text-primary`, etc.

Only classes you use are emitted in the build.

## `--color-{name}` — many utility families

Registers a **color**. Tailwind exposes it on every color-related property:

`bg-`, `text-`, `border-` (+ `border-t/r/b/l/x/y-`), `divide-`, `outline-`, `ring-`, `inset-ring-`, `ring-offset-`, `shadow-`, `inset-shadow-`, `fill-`, `stroke-`, `accent-`, `caret-`, `decoration-`, `from-` / `via-` / `to-`, `scrollbar-thumb-`, `scrollbar-track-`

First segment = CSS property, second = token name. Hence `border-border` (border **color** = token `border`).

Opacity: `bg-primary/80`. Variants: `hover:bg-primary`, `dark:text-foreground`.

To restrict a token to one property, use a specific namespace instead (e.g. `--border-color-neutral` → only `border-neutral`).

## Other namespaces — one utility family each

Unlike `--color-*`, these map to **one** utility type:

| Namespace | Utilities | Example |
|-----------|-----------|---------|
| `--text-{name}` | **Font size** only: `text-{name}` | `--text-sm: 0.8rem` → `text-sm` |
| `--font-{name}` | Font family: `font-{name}` | `--font-sans: …` → `font-sans` |
| `--radius-{name}` | Border radius: `rounded-{name}` | `--radius-lg: var(--radius)` → `rounded-lg` |
| `--shadow-{name}` | Box shadow: `shadow-{name}` | `--shadow-light: …` → `shadow-light` |
| `--animate-{name}` | Animation: `animate-{name}` | `--animate-fade-in: …` → `animate-fade-in` |

### `--text-{name}` is not text color

`--text-sm` and `--color-muted-foreground` both produce `text-*` classes but mean different things:

| Class | Namespace | Sets |
|-------|-----------|------|
| `text-sm` | `--text-sm` | `font-size` |
| `text-muted-foreground` | `--color-muted-foreground` | `color` |

Optional line-height for a size: `--text-sm--line-height: 1.25rem`.

## Rule of thumb

- **Color value** → `--color-{name}` → usable on bg, text, border, ring, …
- **Non-color token** → namespace matches the utility prefix (`--radius-*` → `rounded-*`, `--font-*` → `font-*`, …)

See `global.css` `@theme inline` for this project's tokens.
