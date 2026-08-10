# Client — Access control

Routes: `/login`, `/`, protected areas (e.g. `/jobs`)

## CLIENT-AUTH-ACL-001 — Unauthenticated visit to a protected area

- Setup: unauthenticated; fresh session
- Action: navigate to a protected area (e.g. `/jobs`)
- Assert: user is redirected to login; the protected area remains unavailable

Traces:
- [FR-AUTH-ACL-003](../../../requirements/fr/auth/access-control.md)

## CLIENT-AUTH-ACL-002 — Authenticated visit to login

- Setup: authenticated user
- Action: navigate to `/login` without a full app reload that clears in-memory session
- Assert: user is redirected to home

Traces:
- [FR-AUTH-ACL-004](../../../requirements/fr/auth/access-control.md)

## CLIENT-AUTH-ACL-003 — Authenticated user reaches protected areas

- Setup: authenticated user
- Action: navigate to a protected area (e.g. `/jobs`)
- Assert: protected area is available

Traces:
- [FR-AUTH-ACL-005](../../../requirements/fr/auth/access-control.md)
