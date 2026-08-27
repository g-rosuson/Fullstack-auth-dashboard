# Client — Tabs

Surface: tabbed listing chrome

## CLIENT-UI-TAB-001 — Tabs are named

- Setup: a tabbed surface with labelled tabs
- Action: observe the tabs
- Assert: each tab exposes that label as its name

Traces:
- [FR-UI-TAB-001](../../../requirements/fr/ui/tabs.md)
- [FR-UI-ACT-001](../../../requirements/fr/ui/action.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-TAB-002 — Selected tab content

- Setup: a tabbed surface with more than one tab
- Action: select a tab that is not the first
- Assert: that tab’s content is shown; the other tabs’ content is not

Traces:
- [FR-UI-TAB-002](../../../requirements/fr/ui/tabs.md)
- [NFR-A11Y-UI-002](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-TAB-003 — First tab content initially

- Setup: a tabbed surface with more than one tab; the user has not selected a tab
- Action: observe the surface
- Assert: the first tab’s content is shown; the other tabs’ content is not

Traces:
- [FR-UI-TAB-003](../../../requirements/fr/ui/tabs.md)
