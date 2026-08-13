import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { ToastType } from './Toast.types';

import { toast, Toaster } from './Toast';

const addToast = (options: Parameters<typeof toast.add>[0] & { type?: ToastType }) => {
    act(() => {
        toast.add({ timeout: 0, ...options });
    });
};

describe('Toaster', () => {
    afterEach(() => {
        act(() => {
            toast.close();
        });
        cleanup();
    });

    it('shows title and description when a toast is added', async () => {
        render(<Toaster />);
        addToast({ title: 'Saved', description: 'Job created' });

        const notification = await screen.findByRole('dialog', { name: 'Saved' });
        expect(within(notification).getByText('Job created')).toBeInTheDocument();
    });

    it('shows a loading status for loading toasts', async () => {
        render(<Toaster />);
        addToast({ type: 'loading', title: 'Working…' });

        const notification = await screen.findByRole('dialog', { name: 'Working…' });
        expect(within(notification).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('does not show a loading status for default toasts', async () => {
        render(<Toaster />);
        addToast({ title: 'Notice' });

        const notification = await screen.findByRole('dialog', { name: 'Notice' });
        expect(within(notification).queryByRole('status')).not.toBeInTheDocument();
    });

    it('closes the toast when the close control is activated', async () => {
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
