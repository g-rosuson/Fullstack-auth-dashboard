import { test as base } from './base';

import { registerUser, buildTestEmail } from '../helpers/api';

import { RegisteredTestUser } from '../types';

interface AuthenticatedFixtures {
    testUser: RegisteredTestUser;
}

const test = base.extend<AuthenticatedFixtures>({
    testUser: async ({}, use, testInfo) => {
        const email = buildTestEmail(testInfo.workerIndex);
        const user = await registerUser(email);

        await use(user);
    },
});

export { test };
