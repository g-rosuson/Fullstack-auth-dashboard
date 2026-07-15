# HTTP — Session tokens

Token delivery on auth success, and the protected-API access-token gate. Lifetimes and cookie flags are NFRs (linked in Traces).

## HTTP-AUTH-TOK-001 — Access token in body

Applies to register, login, or refresh success responses.

- Request: per [registration](./registration.md), [login](./login.md), or [refresh](./refresh.md) success scenario
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <JWT string>, meta: { timestamp: number } }`
  - Note: access token appears only in `data`, never in a cookie

Traces:
- [FR-AUTH-TOK-001](../../../requirements/fr/auth/session.md)
- [NFR-SEC-AUTH-004](../../../requirements/nfr/security/authentication.md)

## HTTP-AUTH-TOK-002 — Refresh token in cookie

Applies to register or login success responses.

- Request: per [registration](./registration.md) or [login](./login.md) success scenario
- Response:
  - Cookie: response includes `Set-Cookie` with name `refreshToken` (value = refresh JWT)
  - Attributes: `HttpOnly`, `SameSite=Strict`, `Path=/`; `Secure` in production only
  - Note: refresh token never appears in the JSON body

Traces:
- [FR-AUTH-TOK-002](../../../requirements/fr/auth/session.md)
- [NFR-SEC-AUTH-003](../../../requirements/nfr/security/authentication.md)
- [NFR-SEC-AUTH-005](../../../requirements/nfr/security/authentication.md)

## HTTP-AUTH-TOK-003 — Protected route without access token

Missing or invalid `Authorization: Bearer` access token on a protected route.

- Request:
  - Header: missing `Authorization`, or `Authorization: Bearer <invalid-or-expired-access-token>`
- Response:
  - Status: `401`
  - Body: `{ success: false, code: "AUTHENTICATION_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-TOK-003](../../../requirements/fr/auth/session.md)
- [FR-AUTH-ACL-001](../../../requirements/fr/auth/access-control.md)
