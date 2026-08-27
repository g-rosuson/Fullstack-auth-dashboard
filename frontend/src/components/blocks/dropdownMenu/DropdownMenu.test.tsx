import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil } from 'lucide-react';
import { afterEach } from 'vitest';

import DropdownMenu from './DropdownMenu';

describe('DropdownMenu block: trigger', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] names the trigger', () => {
        render(<DropdownMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />);

        expect(screen.getByRole('button', { name: 'Dropdown menu trigger' })).toBeInTheDocument();
    });
});

describe('DropdownMenu block: items', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-MNU-001] / [FR-UI-MNU-001] exposes each action with its label as the name', async () => {
        render(
            <DropdownMenu
                items={[
                    { label: 'Edit', onClick: vi.fn() },
                    { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
                ]}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));

        expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('[CLIENT-UI-MNU-002] / [FR-UI-MNU-002] invokes the action when the user activates a menu item', async () => {
        const onEdit = vi.fn();

        render(<DropdownMenu items={[{ label: 'Edit', onClick: onEdit }]} />);

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('renders an icon with the item label', async () => {
        render(<DropdownMenu items={[{ label: 'Edit', icon: <Pencil />, onClick: vi.fn() }]} />);

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));

        const item = screen.getByRole('menuitem', { name: 'Edit' });
        expect(item.querySelector('svg')).toBeInTheDocument();
    });

    it('renders a separator before a destructive item', async () => {
        render(
            <DropdownMenu
                items={[
                    { label: 'Edit', onClick: vi.fn() },
                    { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
                ]}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));

        expect(screen.getByRole('separator')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-variant', 'destructive');
    });
});
