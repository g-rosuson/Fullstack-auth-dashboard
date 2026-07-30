# Login

Authenticate with email and password.

- **FR-AUTH-LOG-001** — The system shall authenticate a user who supplies a registered email and the correct password.
- **FR-AUTH-LOG-002** — The system shall reject authentication when the email is unknown or the password is incorrect, and shall not establish a session.
- **FR-AUTH-LOG-003** — On successful login, the system shall establish an authenticated session (FR-AUTH-TOK-001, FR-AUTH-TOK-002).
- **FR-AUTH-LOG-004** — After successful login, the system shall treat the user as authenticated for continued use of the application without asking for credentials again until the session ends.
- **FR-AUTH-LOG-005** — After failed login, the system shall keep the user on the login view and shall not grant access to protected areas.
- **FR-AUTH-LOG-006** — When login is attempted without the required credentials, the system shall keep the user on the login view and shall not establish a session.
