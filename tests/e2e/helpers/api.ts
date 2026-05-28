import { E2E_TEST_PASSWORD, E2E_TEST_USER, OPENAPI_URL, REGISTER_URL } from '../constants';

import { RegisteredTestUser } from '../types';

/**
 * Checks if the backend is available.
 * @returns True if the backend is available, false otherwise.
 */
async function isBackendAvailable(): Promise<boolean> {
    try {
        const response = await fetch(OPENAPI_URL);

        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Registers a new user.
 * @param email - The email address of the new user.
 * @returns The registered user.
 */
async function registerUser(email: string): Promise<RegisteredTestUser> {
    const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            email,
            firstName: E2E_TEST_USER.firstName,
            lastName: E2E_TEST_USER.lastName,
            password: E2E_TEST_USER.password,
            confirmationPassword: E2E_TEST_USER.confirmationPassword,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to register E2E user (${response.status}): ${body}`);
    }

    return {
        email,
        password: E2E_TEST_PASSWORD,
        firstName: E2E_TEST_USER.firstName,
        lastName: E2E_TEST_USER.lastName,
    };
}

/**
 * Generates a unique test email address.
 * @param workerIndex - The index of the worker.
 * @returns A unique test email address.
 */
function buildTestEmail(workerIndex: number): string {
    return `e2e-w${workerIndex}-${Date.now()}@example.com`;
}

export { isBackendAvailable, registerUser, buildTestEmail };
