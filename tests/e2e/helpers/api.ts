import { E2E_TEST_PASSWORD, E2E_TEST_USER, JOBS_CREATE_URL, OPENAPI_URL, REGISTER_URL } from '../constants';

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

    const json = (await response.json()) as { data: string };

    return {
        email,
        password: E2E_TEST_PASSWORD,
        firstName: E2E_TEST_USER.firstName,
        lastName: E2E_TEST_USER.lastName,
        accessToken: json.data,
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

type E2EJobSchedule = {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string | null;
    status: 'idle' | 'stopped';
} | null;

type E2ECreateJobInput = {
    name: string;
    schedule: E2EJobSchedule;
    tools: Array<{
        type: 'scraper';
        keywords: string[];
        maxPages: number;
        targets: Array<{ target: 'jobs-ch' }>;
    }>;
};

/**
 * Builds a create-job payload with a single scraper tool.
 */
function mapToJobPayload(name: string, schedule: E2EJobSchedule = null): E2ECreateJobInput {
    return {
        name,
        schedule,
        tools: [
            {
                type: 'scraper',
                keywords: ['e2e'],
                maxPages: 1,
                targets: [{ target: 'jobs-ch' }],
            },
        ],
    };
}

/**
 * Builds a far-future daily schedule so the job does not fire during the test.
 */
function mapToFutureSchedule(status: 'idle' | 'stopped' = 'idle'): NonNullable<E2EJobSchedule> {
    return {
        type: 'daily',
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: null,
        status,
    };
}

/**
 * Creates a job as the given user via the jobs API.
 */
async function createJob(accessToken: string, payload: E2ECreateJobInput) {
    const response = await fetch(JOBS_CREATE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create E2E job (${response.status}): ${body}`);
    }

    return (await response.json()) as { data: { id: string; name: string } };
}

export {
    isBackendAvailable,
    registerUser,
    buildTestEmail,
    mapToJobPayload,
    mapToFutureSchedule,
    createJob,
};
