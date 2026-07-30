# Managing Context in Cursor

Keep prompts small and relevant. Less noise means cheaper, more accurate answers.

## 1. Built-in Cursor Features

* **/compress** — In chat, run `/compress` to distill long history into a short summary and free context window space.

* **Fresh chat + @Past Chats** — Prefer a new chat over Forking a heavy thread (fork copies the full history). Pull only what you need with `@Past Chats`.

* **Selective @ references** — Prefer specific files (and line ranges when useful, e.g. `@file.ts:10-50`) over broad `@Codebase` or dumping whole folders.

* **`.cursorignore` (hard block)** — Paths listed here are invisible to indexing, Agent, Tab, and `@` mentions. Use for secrets, `node_modules/`, build output, and anything the model should never see.

* **`.cursorindexingignore` (index only)** — Paths are skipped from the codebase index/search but stay readable via `@` or drag-and-drop. Use for large mocks, fixtures, or generated dumps you still want to open on demand.

> Cursor already ignores `.gitignore` matches and a default list (e.g. `node_modules/`, lockfiles, media) for indexing. Use `.cursorignore` when you need a hard access block; use `.cursorindexingignore` when you only want a quieter index.

## 2. External Tools

* **Context compressors** (e.g. gotcontext, Headroom) — Strip whitespace, truncate stack traces, and summarize logs before they hit the model. Useful for large terminal or log pastes.

* **Repo-to-text** (e.g. repomix) — Bundle selected parts of a repo into one text file with token counts. Use when you need a controlled snapshot rather than open-ended `@Codebase` search.

## 3. Prefer Types Over Raw Payloads

Do not paste large JSON responses into chat. Convert the payload to a TypeScript interface (or Zod schema), then `@` that type file so the agent maps changes from the shape—not from hundreds of sample lines.

## 4. Rules and Skills

Project rules (`.cursor/rules/*.mdc`) and skills are injected into context. Keep them short, scoped, and actionable. Drop or split rules that repeat the same guidance—every extra line competes with your code for window space.

## References

* [Cursor: Ignore files](https://cursor.com/docs/reference/ignore-file)
* [Cursor indexing ignore vs hard ignore](https://eastondev.com/blog/en/posts/dev/20260115-cursor-codebase-index-optimization/)
* [Token-efficiency tips for AI agents](https://kiara.tech/blog/stop-burning-cash-how-to-master-token-efficiency-with-ai-agents)
* [Cursor rules overview](https://www.vibecodingacademy.ai/blog/cursor-rules-complete-guide)
