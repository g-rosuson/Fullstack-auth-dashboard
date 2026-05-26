import { expect, test } from '../fixtures/base';

test.describe('smoke', () => {
    test('login page loads and primary UI is visible', async ({ loginPage }) => {
        await loginPage.goto();
        await expect(loginPage.heading).toBeVisible();
        await expect(loginPage.submitButton).toBeVisible();
        await expect(loginPage.form).toBeVisible();
    });
});
