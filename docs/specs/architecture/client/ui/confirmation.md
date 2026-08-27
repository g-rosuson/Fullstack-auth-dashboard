# Client — Confirmation

Surface: confirmation prompt chrome

## CLIENT-UI-TTL-004 — Required title is a heading

- Setup: an open confirmation prompt with a required title
- Action: observe the title
- Assert: it is a heading whose accessible name is that title; the dialog is named from that title

Traces:
- [FR-UI-TTL-001](../../../requirements/fr/ui/title.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-CNF-001 — Confirm proceeds

- Setup: an open confirmation prompt
- Action: activate the confirm action
- Assert: the confirmed action is invoked

Traces:
- [FR-UI-CNF-001](../../../requirements/fr/ui/confirm.md)

## CLIENT-UI-CNF-002 — Dismiss without confirming

- Setup: an open confirmation prompt
- Action: activate the dismiss action
- Assert: the prompt requests to close; the confirmed action is not invoked

Traces:
- [FR-UI-CNF-002](../../../requirements/fr/ui/confirm.md)
