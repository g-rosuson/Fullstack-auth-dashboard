# Client — Date

Surface: date control chrome

## CLIENT-UI-DAT-001 — Choose a date

- Setup: a date control with no date selected
- Action: open the calendar and choose a day
- Assert: the chosen date is reported and the calendar is no longer shown

Traces:
- [FR-UI-DAT-001](../../../requirements/fr/ui/date.md)
- [NFR-A11Y-UI-002](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-DAT-002 — Placeholder or selected date

- Setup: a date control with no date selected; a date control with a date selected
- Action: observe each control
- Assert: the empty control shows a placeholder; the selected control shows that date

Traces:
- [FR-UI-DAT-002](../../../requirements/fr/ui/date.md)

## CLIENT-UI-DAT-003 — Required empty is invalid

- Setup: a required date control with no date selected; a required date control with a date selected
- Action: observe each control
- Assert: the empty control is invalid; the selected control is valid

Traces:
- [FR-UI-DAT-003](../../../requirements/fr/ui/date.md)
