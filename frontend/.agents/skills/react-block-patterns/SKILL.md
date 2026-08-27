---
name: react-block-patterns
description: >-
  Create, move, and test product UI blocks under frontend/src/components/blocks.
  Covers content-model props, composing ui/ primitives, shared variants, named
  spacing tokens, FR-UI / CLIENT-UI docs, and co-located tests that cite those
  IDs. Use when adding a block, wrapping a shadcn primitive, migrating a page
  off ui/, authoring shared chrome requirements, or writing Block.test.tsx.
---

# Purpose

A block is a product content model (`label`, `title` / `description`, `groups`) that pages import. Primitive slots stay inside the block. The block composes `ui/` primitives and `blocks/shared/variants`. Copy `src/components/blocks/button/`, `card/`, or `form/` and match it.

Naming: [coding-standards](../../rules/coding-standards.mdc). Pages compose `blocks/`: [frontend](../../rules/frontend.mdc). FR/CLIENT prose: [writing-docs](../../../../.agents/skills/writing-docs/SKILL.md).

# Type and spacing

Primitive keeps stock type. Block overwrites with `titleVariants` / `textVariants` or a recipe from `recipes.ts`. Repeated CVA args → add a recipe.

Named tokens only (`xs`–`xl` in `src/stylesheets/global.css`). No hanging numbered utilities (`p-1`, `gap-3`, `mt-2.5`). `0` is fine. Snap leftovers to the nearest token. On primitives:

# Requirements and tests

```text
FR-UI / NFR-A11Y-UI  →  CLIENT-UI  →  Block.test.tsx
FR-<domain>          →  CLIENT-<domain>  →  page E2E
```

Reuse an FR when the contract matches; new CLIENT per surface. New capability only for new chrome. Scan `fr/ui/` and `client/ui/`; never renumber. Cite `NFR-A11Y-UI-001` / `002` when the assert is name, role, or keyboard. Copy an existing pair for file shape; link both `index.md` files.

`describe('Name block: <concern>')`. Prefix cases that prove a CLIENT. Keep existing assertions.

```ts
it('[CLIENT-UI-<CAP>-###] / [FR-UI-<CAP>-###] <observable outcome>', () => { … })
```

# Create

1. `npm run scadd` if the primitive is missing. Keep stock type and slot structure. Named spacing; comment swaps.
2. Content-model props; compose primitives and existing blocks; variants + named spacing on the block. Slot names: **title** and **description**.
3. Recipe if a second block needs the same CVA args. Form duplicate → `form/controls/` adapter.
4. FR / CLIENT-UI; tests cite those IDs.
5. Point every importer at the block. Delete a wrapper only when grep is empty. Leave `ui/` in place.
