# Session

Issue, renew, and restore authenticated sessions. Token lifetimes, cookie security attributes, and storage constraints are non-functional — see `nfr/security/authentication.md`.

## Tokens

- **FR-AUTH-TOK-001** — After successful registration or login, the system shall issue a short-lived access token to the client for calling protected APIs.
- **FR-AUTH-TOK-002** — The system shall issue a longer-lived refresh credential that can renew the access token, and shall not include that credential in the response body.
- **FR-AUTH-TOK-003** — The system shall require a valid access token before fulfilling protected API requests.
- **FR-AUTH-TOK-004** — The system shall reject access or refresh credentials whose identity claims are missing or malformed.

## Renewal

- **FR-AUTH-REF-001** — With a valid refresh credential, the system shall issue a new access token without requiring the user to sign in again.
- **FR-AUTH-REF-002** — Without a valid refresh credential, the system shall reject access-token renewal.
- **FR-AUTH-REF-003** — The system shall reject renewal when the presented credential is not a valid refresh credential (including when an access token is presented instead).

## Client lifecycle

- **FR-AUTH-SES-001** — When the application starts without a current access token but a usable refresh credential exists, the system shall renew the access token and restore the authenticated session.
- **FR-AUTH-SES-002** — When the access token expires while the user is in a protected area, the system shall allow the user to renew the session; if they do not renew within the grace period (NFR-SEC-AUTH-015), the system shall end the session.
- **FR-AUTH-SES-003** — When no usable refresh credential remains, the system shall treat the user as unauthenticated and send them to the login view.

## Password policy

- **FR-AUTH-PWD-001** — Passwords shall be at least 8 characters and include an uppercase letter, a lowercase letter, a digit, and a special character. On registration, the confirmation password shall match the password.
