# Client — Login

Route: `/login`

## CLIENT-AUTH-LOG-001 — Successful login

- Setup: registered user; unauthenticated on `/login`
- Action: submit email and correct password
- Assert: user lands on home as authenticated; protected areas are available without asking for credentials again

Traces:
- [FR-AUTH-LOG-001](../../../requirements/fr/auth/login.md)
- [FR-AUTH-LOG-003](../../../requirements/fr/auth/login.md)
- [FR-AUTH-LOG-004](../../../requirements/fr/auth/login.md)
- [HTTP-AUTH-LOG-001](../../http/auth/login.md)

## CLIENT-AUTH-LOG-002 — Wrong password

- Setup: registered user; unauthenticated on `/login`
- Action: submit email with an incorrect password
- Assert: login view remains; protected areas remain unavailable and a visible error is shown

Traces:
- [FR-AUTH-LOG-002](../../../requirements/fr/auth/login.md)
- [FR-AUTH-LOG-005](../../../requirements/fr/auth/login.md)
- [HTTP-AUTH-LOG-002](../../http/auth/login.md)

## CLIENT-AUTH-LOG-003 — Unknown email

- Setup: unauthenticated on `/login`
- Action: submit an unknown email with any password
- Assert: login view remains; protected areas remain unavailable and a visible error is shown

Traces:
- [FR-AUTH-LOG-002](../../../requirements/fr/auth/login.md)
- [FR-AUTH-LOG-005](../../../requirements/fr/auth/login.md)
- [HTTP-AUTH-LOG-002](../../http/auth/login.md)

## CLIENT-AUTH-LOG-004 — Empty credentials blocked

- Setup: unauthenticated on `/login`
- Action: submit without the required credentials
- Assert: login view remains; session is not established; protected areas remain unavailable and a visible error is shown

Traces:
- [FR-AUTH-LOG-006](../../../requirements/fr/auth/login.md)
