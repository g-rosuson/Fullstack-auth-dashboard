# Client — Toast

Surface: brief notification chrome

## CLIENT-UI-NTF-001 — Notification is named from its title

- Setup: a brief notification with a title
- Action: observe the notification
- Assert: it is named from that title

Traces:
- [FR-UI-NTF-001](../../../requirements/fr/ui/notify.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-NTF-002 — Optional description is visible

- Setup: a brief notification with a title and a description
- Action: observe the notification
- Assert: the description is visible

Traces:
- [FR-UI-NTF-002](../../../requirements/fr/ui/notify.md)

## CLIENT-UI-NTF-003 — Dismiss

- Setup: a brief notification
- Action: activate the dismiss control
- Assert: the notification is no longer shown

Traces:
- [FR-UI-NTF-003](../../../requirements/fr/ui/notify.md)

## CLIENT-UI-NTF-004 — In-progress loading status

- Setup: a brief notification that indicates an in-progress outcome
- Action: observe the notification
- Assert: a loading status is exposed

Traces:
- [FR-UI-NTF-004](../../../requirements/fr/ui/notify.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)
