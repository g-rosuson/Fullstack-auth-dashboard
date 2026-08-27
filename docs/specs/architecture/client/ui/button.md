# Client — Button

Surface: action control

## CLIENT-UI-ACT-001 — Accessible name

- Setup: an action with a visible label; an action with no visible label and an equivalent name
- Action: observe each control
- Assert: each exposes that name

Traces:
- [FR-UI-ACT-001](../../../requirements/fr/ui/action.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-ACT-002 — In progress

- Setup: a primary action in progress
- Action: observe the control; activate it
- Assert: progress is indicated; the action is not invoked again

Traces:
- [FR-UI-ACT-002](../../../requirements/fr/ui/action.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-ACT-003 — Form submit designation

- Setup: an action inside a form, designated as submit; an action inside a form that is not designated as submit
- Action: activate each control
- Assert: only the designated submit submits the form

Traces:
- [FR-UI-ACT-003](../../../requirements/fr/ui/action.md)

## CLIENT-UI-ACT-004 — Unavailable appearance and pointer

- Setup: an unavailable action
- Action: observe the control
- Assert: appearance and pointer indicate the action is unavailable

Traces:
- [FR-UI-ACT-004](../../../requirements/fr/ui/action.md)
