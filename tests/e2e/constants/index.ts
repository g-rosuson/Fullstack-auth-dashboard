/** Matches backend integration test password (satisfies register schema). */
const E2E_TEST_PASSWORD = 'SecureP@ss1';

/** A registered test user. */
const E2E_TEST_USER = {
    firstName: 'E2E',
    lastName: 'User',
    password: E2E_TEST_PASSWORD,
    confirmationPassword: E2E_TEST_PASSWORD,
};

/** The URL of the OpenAPI endpoint. */
const OPENAPI_URL = `${process.env.E2E_BACKEND_URL}/api/docs/openapi`;

/** The URL of the register endpoint. */
const REGISTER_URL = `${process.env.E2E_BACKEND_URL}/api/auth/register`;

export { E2E_TEST_USER, E2E_TEST_PASSWORD, OPENAPI_URL, REGISTER_URL };
