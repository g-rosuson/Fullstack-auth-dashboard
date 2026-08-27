# Client — Form

Surface: form chrome

## CLIENT-UI-FRM-001 — Named form

- Setup: a named form
- Action: observe the form
- Assert: it exposes that name

Traces:
- [FR-UI-FRM-001](../../../requirements/fr/ui/form.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-FRM-002 — Associated visible labels

- Setup: a form with controls
- Action: observe each control
- Assert: each has a visible label associated with it

Traces:
- [FR-UI-FRM-002](../../../requirements/fr/ui/form.md)

## CLIENT-UI-FRM-003 — Invalid control

- Setup: a form control with a validation failure; a required empty control on submit
- Action: observe the invalid control; submit the form with a required field empty
- Assert: the failure is visible with the control and the control is marked invalid; submit does not proceed when required fields are empty

Traces:
- [FR-UI-FRM-003](../../../requirements/fr/ui/form.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-FRM-004 — Named group

- Setup: a form group with a name; a form group with no name
- Action: observe each group
- Assert: the named group exposes that name; the unnamed group has no group name

Traces:
- [FR-UI-FRM-004](../../../requirements/fr/ui/form.md)
