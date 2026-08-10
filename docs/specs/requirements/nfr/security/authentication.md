# Authentication security

How well authentication protects credentials and sessions. Functional behavior is under `fr/auth/`.

## Credentials

- **NFR-SEC-AUTH-001** — Passwords shall be stored using bcrypt with a cost factor of 10. Plain-text passwords shall not be persisted.
- **NFR-SEC-AUTH-002** — Passwords, password hashes, access tokens, and refresh tokens shall not appear in application logs.

## Tokens and cookies

- **NFR-SEC-AUTH-003** — The refresh credential shall be delivered as an HTTP cookie that is `HttpOnly`, `SameSite=Strict`, and `Path=/`. In production the cookie shall also be `Secure`.
- **NFR-SEC-AUTH-004** — Access tokens shall expire after 7 hours.
- **NFR-SEC-AUTH-005** — Refresh tokens shall expire after 14 days.
- **NFR-SEC-AUTH-006** — Access and refresh tokens shall be signed with distinct secrets from environment configuration. Secrets shall not be hardcoded in source.
- **NFR-SEC-AUTH-007** — Access tokens shall not be stored in `localStorage` or `sessionStorage`; they shall remain in application memory only.

## Abuse and input

- **NFR-SEC-AUTH-008** — Login attempts shall be limited to at most 5 requests per IP address per 15 minutes when rate limiting is enabled.
- **NFR-SEC-AUTH-009** — Registration attempts shall be limited to at most 3 requests per IP address per hour when rate limiting is enabled.
- **NFR-SEC-AUTH-010** — Access-token refresh attempts shall be limited to at most 15 requests per IP address per 5 minutes when rate limiting is enabled.
- **NFR-SEC-AUTH-011** — Login failures for an unknown email and for an incorrect password shall produce the same failure response so that account existence is not revealed.
- **NFR-SEC-AUTH-012** — Authentication request bodies that contain HTML tags shall be rejected.
- **NFR-SEC-AUTH-013** — Outside development, error responses shall not expose stack traces.

## Configuration and session timing

- **NFR-SEC-AUTH-014** — Authentication-related environment configuration shall be validated at application startup before the service accepts traffic.
- **NFR-SEC-AUTH-015** — After access-token expiry on a protected view, the user shall have 90 seconds to renew the session before the system logs them out.
