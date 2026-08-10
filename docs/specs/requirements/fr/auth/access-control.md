# Access control

Restrict application access to authenticated users.

- **FR-AUTH-ACL-001** — The system shall associate each authenticated request with the identity of the user who holds the access token.
- **FR-AUTH-ACL-002** — Protected data shall be available only to the authenticated owner; a user shall not access another user’s data.
- **FR-AUTH-ACL-003** — An unauthenticated visit to a protected area shall redirect the user to the login view.
- **FR-AUTH-ACL-004** — An authenticated visit to the login view shall redirect the user to the home view.
- **FR-AUTH-ACL-005** — An authenticated user shall be able to reach protected areas of the application.
