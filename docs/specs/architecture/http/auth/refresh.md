# HTTP — Refresh

`GET /api/auth/refresh`

## HTTP-AUTH-REF-001 — Valid refresh cookie

- Request:
  - No body
  - Cookie: request includes `refreshToken` (valid refresh JWT)
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <JWT string>, meta: { timestamp: string } }`
  - Note: `data` is a new access token (may differ from the previous access token)

Traces:
- [FR-AUTH-REF-001](../../../requirements/fr/auth/session.md)
- [FR-AUTH-TOK-001](../../../requirements/fr/auth/session.md)

## HTTP-AUTH-REF-002 — Missing refresh cookie

- Request:
  - No body
  - Cookie: no request cookie named `refreshToken`
- Response:
  - Status: `401`
  - Body: `{ success: false, code: "AUTHENTICATION_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-REF-002](../../../requirements/fr/auth/session.md)

## HTTP-AUTH-REF-003 — Invalid refresh credential

Cookie present but not a verifiable refresh JWT (malformed, or an access token used as the cookie value).

- Request:
  - No body
  - Cookie: request includes `refreshToken` with an invalid or non-refresh JWT value
- Response:
  - Status: `401`
  - Body: `{ success: false, code: "AUTHENTICATION_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-REF-003](../../../requirements/fr/auth/session.md)
- [FR-AUTH-TOK-004](../../../requirements/fr/auth/session.md)
