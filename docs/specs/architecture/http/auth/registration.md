# HTTP — Registration

`POST /api/auth/register`

## HTTP-AUTH-REG-001 — Valid payload

- Request:
  - `Content-Type: application/json`
  - Required body fields: `firstName`, `lastName`, `email`, `password`, `confirmationPassword`
  - Formats: `email` = valid email address; `password` / `confirmationPassword` = [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md) and must match (full rules in OpenAPI / Zod `registerUserInputSchema`)
  - Values: new unused email; passwords match and meet policy
- Response:
  - Status: `200`
  - Body: `{ success: true, data: <JWT string>, meta: { timestamp: number } }`
  - Cookie: response includes `Set-Cookie` with name `refreshToken` (value = refresh JWT; attributes per [HTTP-AUTH-TOK-002](./session.md))

Traces:
- [FR-AUTH-REG-001](../../../requirements/fr/auth/registration.md)
- [FR-AUTH-REG-005](../../../requirements/fr/auth/registration.md)
- [HTTP-AUTH-TOK-001](./session.md)
- [HTTP-AUTH-TOK-002](./session.md)

## HTTP-AUTH-REG-002 — Duplicate email

- Request:
  - `Content-Type: application/json`
  - Required body fields: `firstName`, `lastName`, `email`, `password`, `confirmationPassword`
  - Formats: same as HTTP-AUTH-REG-001 (body must still pass schema validation)
  - Values: `email` already registered
- Response:
  - Status: `409`
  - Body: `{ success: false, code: "CONFLICT_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-REG-002](../../../requirements/fr/auth/registration.md)

## HTTP-AUTH-REG-003 — Invalid body

Missing/invalid fields, password policy failure, or confirmation mismatch.

- Request:
  - `Content-Type: application/json`
  - Required body fields: `firstName`, `lastName`, `email`, `password`, `confirmationPassword`
  - Formats: at least one field fails OpenAPI / Zod `registerUserInputSchema` or [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md)
- Response:
  - Status: `400`
  - Body: `{ success: false, code: "VALIDATION_ERROR", timestamp: string, issues: […] }`

Traces:
- [FR-AUTH-REG-003](../../../requirements/fr/auth/registration.md)
- [FR-AUTH-PWD-001](../../../requirements/fr/auth/session.md)

## HTTP-AUTH-REG-004 — Registration disabled

When `ENABLE_REGISTRATION=false`; user is not created.

- Request:
  - `Content-Type: application/json`
  - Required body fields: `firstName`, `lastName`, `email`, `password`, `confirmationPassword`
  - Formats: same as HTTP-AUTH-REG-001
  - Values: otherwise valid registration payload
- Response:
  - Status: `403`
  - Body: `{ success: false, code: "FORBIDDEN_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-REG-004](../../../requirements/fr/auth/registration.md)
