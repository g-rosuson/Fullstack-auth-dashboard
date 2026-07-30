# HTTP — Logout

`POST /api/auth/logout`

## HTTP-AUTH-OUT-001 — Missing refresh cookie

- Request:
  - No body
  - Cookie: no request cookie named `refreshToken`
- Response:
  - Status: `401`
  - Body: `{ success: false, code: "AUTHENTICATION_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-OUT-003](../../../requirements/fr/auth/logout.md)

## HTTP-AUTH-OUT-002 — Valid refresh cookie

- Request:
  - No body
  - Cookie: request includes `refreshToken` (valid refresh JWT)
- Response:
  - Status: `200`
  - Body: `{ success: true, meta: { timestamp: number } }` (no `data`)
  - Cookie: response includes `Set-Cookie` with name `refreshToken` that clears the cookie (expired or `Max-Age=0`; same `Path` / `HttpOnly` / `SameSite` as when set)

Traces:
- [FR-AUTH-OUT-001](../../../requirements/fr/auth/logout.md)

## HTTP-AUTH-OUT-003 — Refresh after logout

After successful logout, a subsequent refresh without a usable `refreshToken` cookie fails as [HTTP-AUTH-REF-002](./refresh.md).

- Request:
  - Method/path: `GET /api/auth/refresh`
  - Cookie: no usable `refreshToken` cookie (cleared by logout)
- Response:
  - Status: `401`
  - Body: `{ success: false, code: "AUTHENTICATION_ERROR", timestamp: string }`

Traces:
- [FR-AUTH-OUT-002](../../../requirements/fr/auth/logout.md)
- [HTTP-AUTH-REF-002](./refresh.md)
