# Client — Table

Surface: tabular listing chrome

## CLIENT-UI-TBL-001 — Column names are column headers

- Setup: a tabular listing with named columns
- Action: observe the listing
- Assert: each column name is a column header

Traces:
- [FR-UI-TBL-001](../../../requirements/fr/ui/table.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-TBL-002 — Row values under headers

- Setup: a tabular listing with named columns and rows
- Action: observe the listing
- Assert: each row’s values appear in cells under the corresponding column headers

Traces:
- [FR-UI-TBL-002](../../../requirements/fr/ui/table.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)

## CLIENT-UI-TBL-003 — Empty listing

- Setup: a tabular listing with named columns and no rows
- Action: observe the listing
- Assert: the listing indicates there are no results

Traces:
- [FR-UI-TBL-003](../../../requirements/fr/ui/table.md)

## CLIENT-UI-TBL-004 — Next and previous page

- Setup: a tabular listing with more rows than one page
- Action: activate next page, then previous page
- Assert: the next page of rows is shown, then the previous page is restored; the page controls are named

Traces:
- [FR-UI-TBL-004](../../../requirements/fr/ui/table.md)
- [FR-UI-ACT-001](../../../requirements/fr/ui/action.md)
- [NFR-A11Y-UI-001](../../../requirements/nfr/accessibility/ui.md)
