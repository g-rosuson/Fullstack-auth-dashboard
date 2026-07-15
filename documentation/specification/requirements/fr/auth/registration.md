# Registration

Create an account and establish a session.

- **FR-AUTH-REG-001** — The system shall allow a new user to register with first name, last name, email, password, and confirmation password.
- **FR-AUTH-REG-002** — The system shall reject registration when the email already belongs to an account.
- **FR-AUTH-REG-003** — The system shall reject registration when required fields are missing or invalid, the password does not meet FR-AUTH-PWD-001, or the confirmation password does not match.
- **FR-AUTH-REG-004** — When registration is disabled by configuration, the system shall reject the request and shall not create an account.
- **FR-AUTH-REG-005** — On successful registration, the system shall establish an authenticated session (FR-AUTH-TOK-001, FR-AUTH-TOK-002).
