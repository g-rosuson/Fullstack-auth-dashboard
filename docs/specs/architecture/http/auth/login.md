# HTTP — Login

`POST /api/auth/login`

## HTTP-AUTH-LOG-001 — Valid credentials

- Request:
  - `Content-Type: application/json`
  - Required body fields: `email`, `password`
  - Formats: `email` = valid email address; `password` = [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md) (full rules in OpenAPI / Zod `loginUserInputSchema`)
  - Values: registered email + correct password
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <JWT string>, meta: { timestamp: number } }`
  - Cookie: response includes `Set-Cookie` with name `refreshToken` (value = refresh JWT; attributes per [HTTP-AUTH-TOK-002](./session.md))

Traces:
- [FR-AUTH-LOG-001](../../../requirements/fr/auth/login.md)
- [FR-AUTH-LOG-003](../../../requirements/fr/auth/login.md)
- [HTTP-AUTH-TOK-001](./session.md)
- [HTTP-AUTH-TOK-002](./session.md)

## HTTP-AUTH-LOG-002 — Invalid credentials

Wrong password, wrong email, or unknown user — identical response in all cases (no account-existence leak).

- Request:
  - `Content-Type: application/json`
  - Required body fields: `email`, `password`
  - Formats: same as HTTP-AUTH-LOG-001 (body must still pass schema validation)
  - Values: wrong password, wrong email, or unknown user
- Response:
  - Status: `404`
  - Body: `{ success: false, code: "NOT_FOUND_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-LOG-002](../../../requirements/fr/auth/login.md)
- [NFR-SEC-AUTH-011](../../../requirements/nfr/security/authentication.md)
