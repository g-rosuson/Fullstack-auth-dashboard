# Client — Popover

Surface: popover panel chrome

## CLIENT-UI-POP-001 — Panel visibility

- Setup: a trigger with associated panel content; the panel closed; the panel open
- Action: observe each state; activate the trigger
- Assert: the closed panel hides the content; the open panel shows it; activating the trigger requests the panel to open or close

Traces:
- [FR-UI-POP-001](../../../requirements/fr/ui/popover.md)
- [NFR-A11Y-UI-002](../../../requirements/nfr/accessibility/ui.md)
