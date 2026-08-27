import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { ToastAddOptions } from './Toast.types';

import { toast, Toaster } from './Toast';

const addToast = (options: ToastAddOptions) => {
    act(() => {
        toast.add({ timeout: 0, ...options });
    });
};

describe('Toast block: chrome', () => {
    afterEach(() => {
        act(() => {
            toast.close();
        });
        cleanup();
    });

    it('[CLIENT-UI-NTF-001] / [FR-UI-NTF-001] names the notification from its title', async () => {
        render(<Toaster />);
        addToast({ title: 'Saved' });

        expect(await screen.findByRole('dialog', { name: 'Saved' })).toBeInTheDocument();
    });

    it('[CLIENT-UI-NTF-002] / [FR-UI-NTF-002] shows an optional visible description', async () => {
        render(<Toaster />);
        addToast({ title: 'Saved', description: 'Job created' });

        const notification = await screen.findByRole('dialog', { name: 'Saved' });
        expect(within(notification).getByText('Job created')).toBeInTheDocument();
        expect(within(notification).getByText('Job created')).not.toHaveClass('sr-only');
    });

    it('[CLIENT-UI-NTF-004] / [FR-UI-NTF-004] exposes a loading status for an in-progress notification', async () => {
        render(<Toaster />);
        addToast({ type: 'loading', title: 'Working…' });

        const notification = await screen.findByRole('dialog', { name: 'Working…' });
        expect(within(notification).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('does not expose a loading status when the notification is not in progress', async () => {
        render(<Toaster />);
        addToast({ title: 'Notice' });

        const notification = await screen.findByRole('dialog', { name: 'Notice' });
        expect(within(notification).queryByRole('status')).not.toBeInTheDocument();
    });
});

describe('Toast block: dismiss', () => {
    afterEach(() => {
        act(() => {
            toast.close();
        });
        cleanup();
    });

    it('[CLIENT-UI-NTF-003] / [FR-UI-NTF-003] dismisses the notification when the user activates the close control', async () => {
        render(<Toaster />);
        addToast({ title: 'Dismiss me' });

        const notification = await screen.findByRole('dialog', { name: 'Dismiss me' });
        // Base UI marks Toast.Close aria-hidden, so include hidden nodes until the primitive exposes it.
        await userEvent.click(within(notification).getByRole('button', { hidden: true }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: 'Dismiss me' })).not.toBeInTheDocument();
        });
    });
});
