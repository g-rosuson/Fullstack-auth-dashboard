# TKT-UI-004 — Fix overlay visibility and squeezed content

`fix/tkt-ui-004-overlay-visibility-width`

Labels: `fix`

## User story

As a user, I want dialogs, sheets, and the mobile sidebar to appear on top of the page with enough room for their content so that I can use overlay flows on both small and large viewports.

## Definition of done

- [ ] Overlay primitives (`Dialog`, `Sheet`, and the mobile sidebar sheet) are visible above page chrome at mobile and larger viewports. The mobile sidebar is not invisible or zero-width when opened
- [ ] Overlay content is not squeezed: title, body, fields, and actions stay readable and usable (no unusable narrow column, clipped controls, or horizontal overflow that hides required content)
- [ ] Nested overlays stay visible and interactive (add-tool dialog over the job sheet; confirmation over the jobs list; session-renew dialog over any protected view)
- [ ] Call-site width overrides that fight the primitive (e.g. `min-w-[60%]` vs a small `max-w`) are resolved in the primitive or removed at the call site
- [ ] Overlay flows still satisfy [CLIENT-JOBS-CRT-001](../../specs/architecture/client/jobs/create.md), [CLIENT-JOBS-TLR-001](../../specs/architecture/client/jobs/sheet.md), [CLIENT-JOBS-DEL-001](../../specs/architecture/client/jobs/delete.md), and [CLIENT-AUTH-SES-002](../../specs/architecture/client/auth/session.md)

## Traces

- [FR-JOBS-CRT-001](../../specs/requirements/fr/jobs/lifecycle/create.md)
- [FR-JOBS-TLR-002](../../specs/requirements/fr/jobs/tools/tools.md)
- [FR-JOBS-DEL-001](../../specs/requirements/fr/jobs/lifecycle/delete.md)
- [FR-AUTH-SES-002](../../specs/requirements/fr/auth/session.md)
- [CLIENT-JOBS-CRT-001](../../specs/architecture/client/jobs/create.md)
- [CLIENT-JOBS-TLR-001](../../specs/architecture/client/jobs/sheet.md)
- [CLIENT-JOBS-DEL-001](../../specs/architecture/client/jobs/delete.md)
- [CLIENT-AUTH-SES-002](../../specs/architecture/client/auth/session.md)
