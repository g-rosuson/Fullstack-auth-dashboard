import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
    readonly page: Page;
    readonly userMenuTrigger: Locator;

    constructor(page: Page) {
        this.page = page;
        this.userMenuTrigger = page.getByRole('button', { name: 'Dropdown menu trigger' });
    }

    async logout() {
        await this.userMenuTrigger.click();
        await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    }
}
