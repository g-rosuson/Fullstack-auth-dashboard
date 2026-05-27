import { test as base } from '@playwright/test';

import { LoginPage } from '../pages/login.page';

type E2EFixtures = {
    loginPage: LoginPage;
};

const test = base.extend<E2EFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});

export { test };
