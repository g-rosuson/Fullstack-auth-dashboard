import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { TabsProps } from './Tabs';

import Tabs from './Tabs';

const defaultItems: TabsProps['items'] = [
    { value: 'alpha', label: 'Alpha', children: <p>Alpha panel</p> },
    { value: 'beta', label: 'Beta', children: <p>Beta panel</p> },
];

/**
 * Renders Tabs with labelled panels.
 */
const renderTabs = (props: Partial<TabsProps> = {}) => {
    return render(<Tabs items={props.items ?? defaultItems} />);
};

describe('Tabs block: names', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-TAB-001] / [FR-UI-TAB-001] / [FR-UI-ACT-001] exposes each tab with its label as the name', () => {
        renderTabs();

        expect(screen.getByRole('tab', { name: 'Alpha' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Beta' })).toBeInTheDocument();
    });

    it('applies the xs text token on tab labels', () => {
        renderTabs();

        expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveClass('text-xs');
    });
});

describe('Tabs block: selection', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-TAB-003] / [FR-UI-TAB-003] shows the first tab’s content until another tab is selected', () => {
        renderTabs();

        expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Alpha panel')).toBeVisible();
        expect(screen.queryByText('Beta panel')).not.toBeInTheDocument();
    });

    it('[CLIENT-UI-TAB-002] / [FR-UI-TAB-002] shows the selected tab’s content and hides the others', async () => {
        renderTabs();

        await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));

        expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Beta panel')).toBeVisible();
        expect(screen.queryByText('Alpha panel')).not.toBeInTheDocument();
    });

    it('[CLIENT-UI-TAB-002] / [FR-UI-TAB-002] moves selection with the keyboard', async () => {
        renderTabs();

        await userEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
        await userEvent.keyboard('{ArrowRight}');

        expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Beta panel')).toBeVisible();
        expect(screen.queryByText('Alpha panel')).not.toBeInTheDocument();
    });
});
