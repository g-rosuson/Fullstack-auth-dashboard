# Client — Session

App shell (all authenticated routes)

## CLIENT-AUTH-SES-001 — Restore session on start

- Setup: no current access token in the client; a usable refresh credential remains; user opens or reloads the app on a route that requires auth
- Action: application starts / reloads
- Assert: authenticated session is restored without asking for credentials again; the intended authenticated view is available

Traces:
- [FR-AUTH-SES-001](../../../requirements/fr/auth/session.md)
- [FR-AUTH-REF-001](../../../requirements/fr/auth/session.md)
- [HTTP-AUTH-REF-001](../../http/auth/refresh.md)

## CLIENT-AUTH-SES-002 — Renew while in a protected area

- Setup: authenticated user in a protected area; access token expires while a usable refresh credential remains
- Action: renew the session within the grace period
- Assert: authenticated session continues; protected area remains available without returning to login

Traces:
- [FR-AUTH-SES-002](../../../requirements/fr/auth/session.md)
- [FR-AUTH-REF-001](../../../requirements/fr/auth/session.md)
- [HTTP-AUTH-REF-001](../../http/auth/refresh.md)

## CLIENT-AUTH-SES-003 — Session ends without usable refresh

- Setup: authenticated user; refresh credential cleared or otherwise unusable
- Action: reload or otherwise require session restore
- Assert: user is treated as unauthenticated and sent to login; protected areas remain unavailable

Traces:
- [FR-AUTH-SES-003](../../../requirements/fr/auth/session.md)
- [FR-AUTH-REF-002](../../../requirements/fr/auth/session.md)
- [HTTP-AUTH-REF-002](../../http/auth/refresh.md)
