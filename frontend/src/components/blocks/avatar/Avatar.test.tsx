import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import Avatar from './Avatar';

const mockLogoutAction = vi.fn();

const defaultProps = {
    email: 'email@domain.com',
    actions: [{ label: 'Logout', icon: <svg data-testid="logout-icon" />, onClick: mockLogoutAction }],
};

const renderAvatar = () => render(<Avatar {...defaultProps} />);

describe('Avatar block: identity', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-AVR-001] / [FR-UI-AVR-001] shows a glyph derived from the email', () => {
        renderAvatar();

        expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] names the identity control', () => {
        renderAvatar();

        expect(screen.getByLabelText('User avatar')).toBeInTheDocument();
    });
});

describe('Avatar block: actions', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-MNU-001] / [FR-UI-MNU-001] opens the menu of named actions', async () => {
        renderAvatar();

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));

        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
    });

    it('[CLIENT-UI-MNU-002] / [FR-UI-MNU-002] invokes the action when the user activates a menu item', async () => {
        renderAvatar();

        await userEvent.click(screen.getByRole('button', { name: 'Dropdown menu trigger' }));
        await userEvent.click(screen.getByRole('menuitem', { name: /logout/i }));

        expect(mockLogoutAction).toHaveBeenCalledTimes(1);
    });
});
