import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { ComponentProps } from 'react';

import ToolDialog from './ToolDialog';

/**
 * Renders an open add-tool dialog with sensible defaults.
 */
const renderDialog = (props: Partial<ComponentProps<typeof ToolDialog>> = {}) => {
    const onOpenChange = props.onOpenChange ?? vi.fn();
    const onToolAdd = props.onToolAdd ?? vi.fn();
    const onToolEdit = props.onToolEdit ?? vi.fn();

    return render(
        <ToolDialog
            isOpen={props.isOpen ?? true}
            toolToEdit={props.toolToEdit ?? null}
            onOpenChange={onOpenChange}
            onToolAdd={onToolAdd}
            onToolEdit={onToolEdit}
        />
    );
};

describe('ToolDialog: add-tool flow', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-JOBS-TLR-001] shows a tool-type choice', () => {
        renderDialog();

        const dialog = screen.getByRole('dialog', { name: 'Add tool' });
        const toolType = within(dialog).getByLabelText('Tool type');
        expect(within(toolType).getByRole('option', { name: 'Scraper' })).toBeInTheDocument();
        expect(within(toolType).getByRole('option', { name: 'Email' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-CRT-005] / [CLIENT-JOBS-TLR-006] blocks submit when the tool has no target', async () => {
        const onToolAdd = vi.fn();
        renderDialog({ onToolAdd });

        const dialog = screen.getByRole('dialog', { name: 'Add tool' });
        await userEvent.selectOptions(within(dialog).getByLabelText('Tool type'), 'scraper');

        expect(within(dialog).getByRole('button', { name: 'Add tool' })).toBeDisabled();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Add tool' }));
        expect(onToolAdd).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Add tool' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-CRT-006] / [CLIENT-JOBS-TLR-006] blocks submit when required scraper config is missing', async () => {
        const onToolAdd = vi.fn();
        renderDialog({ onToolAdd });

        const dialog = screen.getByRole('dialog', { name: 'Add tool' });
        await userEvent.selectOptions(within(dialog).getByLabelText('Tool type'), 'scraper');
        await userEvent.selectOptions(within(dialog).getByLabelText('Target'), 'jobs-ch');

        expect(within(dialog).getByRole('button', { name: 'Add tool' })).toBeEnabled();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Add tool' }));

        expect(onToolAdd).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Add tool' })).toBeInTheDocument();
        const keywordInputs = within(dialog).getAllByPlaceholderText('Enter a keyword...');
        expect(keywordInputs.some(input => !(input as HTMLInputElement).checkValidity())).toBe(true);
    });

    it('adds a scraper tool when target, keywords, and max pages are set', async () => {
        const onToolAdd = vi.fn();
        renderDialog({ onToolAdd });

        const dialog = screen.getByRole('dialog', { name: 'Add tool' });
        await userEvent.selectOptions(within(dialog).getByLabelText('Tool type'), 'scraper');
        await userEvent.type(within(dialog).getByLabelText(/Max pages/i), '1');
        await userEvent.type(within(dialog).getByPlaceholderText('Enter a keyword...'), 'react{enter}');
        await userEvent.selectOptions(within(dialog).getByLabelText('Target'), 'jobs-ch');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Add tool' }));

        await waitFor(() => {
            expect(onToolAdd).toHaveBeenCalledTimes(1);
        });
        expect(onToolAdd.mock.calls[0][0]).toMatchObject({
            type: 'scraper',
            keywords: ['react'],
            maxPages: 1,
            targets: [expect.objectContaining({ target: 'jobs-ch' })],
        });
    });
});
