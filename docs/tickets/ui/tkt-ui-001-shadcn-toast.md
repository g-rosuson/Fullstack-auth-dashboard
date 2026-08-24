# TKT-UI-001 — Add shadcn Toast

`feat/tkt-ui-001-shadcn-toast`

Labels: `feature`

## User story

As a user, I want brief toast feedback for actions so that I can see success, info, warning, error, and loading outcomes without leaving the page.

## Definition of done

- [x] [shadcn Toast](https://ui.shadcn.com/docs/components/base/toast) primitives live in `frontend/src/components/ui/toast.tsx`
- [x] App wrapper in `frontend/src/components/ui-app/toast/` with status icons below
- [x] `<Toaster />` is mounted once in the app root (`App.tsx`)
- [x] Callers use `toast` from `@/components/ui-app/toast/Toast`
- [x] Types render with the status icons below (coloured as noted)

### Status icons

| Type | Icon |
|------|------|
| (default) | none |
| `success` | green tick in a circle (`CircleCheckIcon`) |
| `info` | muted `i` in a circle (`InfoIcon`) |
| `warning` | loudspeaker / horn (`MegaphoneIcon`) |
| `error` | red X in a circle (`CircleXIcon`) |
| `loading` | [`Spinner`](../../../frontend/src/components/ui-app/spinner/Spinner.tsx) with `type="circle"` |

## Traces

None — shared UI; product flows that emit toasts cite their own FR/CLIENT scenarios.
