# Client — Registration

Route: `/register` (when registration is enabled)

## CLIENT-AUTH-REG-001 — Register form available

- Setup: registration enabled; unauthenticated
- Action: navigate to `/register`
- Assert: registration form shows first name, last name, email, password, and confirmation password

Traces:
- [FR-AUTH-REG-001](../../../requirements/fr/auth/registration.md)

## CLIENT-AUTH-REG-002 — Successful registration

- Setup: registration enabled; register form open; unused email; passwords meet policy and match
- Action: submit registration
- Assert: user lands on home as authenticated; protected areas are available

Traces:
- [FR-AUTH-REG-001](../../../requirements/fr/auth/registration.md)
- [FR-AUTH-REG-005](../../../requirements/fr/auth/registration.md)
- [HTTP-AUTH-REG-001](../../http/auth/registration.md)

## CLIENT-AUTH-REG-003 — Duplicate email

- Setup: registration enabled; email already registered
- Action: submit registration with that email
- Assert: registration success is unavailable and a visible error is shown; session is not established

Traces:
- [FR-AUTH-REG-002](../../../requirements/fr/auth/registration.md)
- [HTTP-AUTH-REG-002](../../http/auth/registration.md)

## CLIENT-AUTH-REG-004 — Invalid fields or password policy

- Setup: registration enabled; register form open
- Action: submit with missing/invalid fields, or a password that does not meet policy
- Assert: registration success is unavailable and a visible error is shown; session is not established

Traces:
- [FR-AUTH-REG-003](../../../requirements/fr/auth/registration.md)
- [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md)
- [HTTP-AUTH-REG-003](../../http/auth/registration.md)

## CLIENT-AUTH-REG-005 — Confirmation mismatch

- Setup: registration enabled; register form open; password and confirmation differ
- Action: submit registration
- Assert: registration success is unavailable and a visible error is shown; session is not established

Traces:
- [FR-AUTH-REG-003](../../../requirements/fr/auth/registration.md)
- [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md)
- [HTTP-AUTH-REG-003](../../http/auth/registration.md)

## CLIENT-AUTH-REG-006 — Registration disabled

- Setup: registration disabled
- Action: attempt to register (navigate to `/register` or submit registration)
- Assert: registration is unavailable and a visible error is shown when a register attempt is possible; no new session is established

Traces:
- [FR-AUTH-REG-004](../../../requirements/fr/auth/registration.md)
- [HTTP-AUTH-REG-004](../../http/auth/registration.md)
