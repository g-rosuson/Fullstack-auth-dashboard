import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
    readonly page: Page;
    readonly userAvatar: Locator;
    readonly sidebar: Locator;

    constructor(page: Page) {
        this.page = page;
        this.userAvatar = page.getByRole('button', { name: 'Dropdown menu trigger' });
        this.sidebar = page.getByTestId('sidebar');
    }

    async logout() {
        await this.userAvatar.click();
        await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    }
}
