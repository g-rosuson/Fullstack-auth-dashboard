import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { DialogProps } from './Dialog';
import type { ReactNode, SubmitEvent as ReactSubmitEvent } from 'react';

import Dialog from './Dialog';

/**
 * Renders Dialog into the JS-DOM with sensible defaults for controlled open state.
 */
const renderDialog = (props: Partial<DialogProps> & { children?: ReactNode } = {}) => {
    const onOpenChange = props.onOpenChange ?? vi.fn();

    return render(
        <Dialog
            open={props.open ?? true}
            onOpenChange={onOpenChange}
            title={props.title ?? 'Dialog title'}
            description={props.description}
            className={props.className}
            formId={props.formId}
            onPrimaryButtonClick={props.onPrimaryButtonClick}
            isSubmitting={props.isSubmitting}
            primaryButtonLabel={props.primaryButtonLabel}
            primaryButtonVariant={props.primaryButtonVariant}
            primaryButtonDisabled={props.primaryButtonDisabled}
            dismissLabel={props.dismissLabel}
            showCloseButton={props.showCloseButton}
            dismissible={props.dismissible}
            width={props.width}>
            {props.children}
        </Dialog>
    );
};

describe('Dialog block: visibility', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does not surface a dialog when open is false', () => {
        renderDialog({ open: false });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows the dialog and main content when open is true', () => {
        renderDialog({
            open: true,
            children: <p>Session details</p>,
        });

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Session details')).toBeInTheDocument();
    });
});

describe('Dialog block: footer and primary action', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] shows a primary action labelled from primaryButtonLabel', () => {
        renderDialog({ primaryButtonLabel: 'Save changes' });

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('does not render a labelled primary button when primaryButtonLabel is omitted', () => {
        renderDialog({ primaryButtonLabel: undefined });

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });

    it('shows a named dismiss action when dismissLabel is set', () => {
        renderDialog({ dismissLabel: 'Cancel' });

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
});

describe('Dialog block: form vs button mode', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-003] / [FR-UI-ACT-003] uses a button primary action and invokes onPrimaryButtonClick when formId is omitted', async () => {
        const onPrimaryButtonClick = vi.fn();

        renderDialog({
            primaryButtonLabel: 'Continue',
            onPrimaryButtonClick,
        });

        const dialog = screen.getByRole('dialog');
        const button = within(dialog).getByRole('button', { name: 'Continue' });

        expect(button.closest('form')).toBeNull();
        expect(button).toHaveAttribute('type', 'button');

        await userEvent.click(button);

        expect(onPrimaryButtonClick).toHaveBeenCalledTimes(1);
    });

    it('[CLIENT-UI-ACT-003] / [FR-UI-ACT-003] associates the primary action with an external form id without wrapping a dialog form', async () => {
        const onFormSubmit = vi.fn((event: ReactSubmitEvent<HTMLFormElement>) => {
            event.preventDefault();
            return Promise.resolve();
        });

        render(
            <Dialog open onOpenChange={vi.fn()} title="Add tool" formId="add-tool-form" primaryButtonLabel="Add">
                <form id="add-tool-form" aria-label="Add tool form" onSubmit={onFormSubmit}>
                    <input name="name" />
                </form>
            </Dialog>
        );

        const dialog = screen.getByRole('dialog');
        const submit = within(dialog).getByRole('button', { name: 'Add' });

        expect(submit).toHaveAttribute('type', 'submit');
        expect(submit).toHaveAttribute('form', 'add-tool-form');
        expect(submit.closest('form')).toBeNull();

        await userEvent.click(submit);

        await waitFor(() => {
            expect(onFormSubmit).toHaveBeenCalledTimes(1);
        });
    });
});

describe('Dialog block: submitting state', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-002] / [FR-UI-ACT-002] shows loading feedback and disables the primary action while submitting', () => {
        renderDialog({
            formId: 'add-tool-form',
            primaryButtonLabel: 'Save',
            isSubmitting: true,
        });

        const dialog = screen.getByRole('dialog');
        const submit = within(dialog).getByRole('button', { name: /save/i });

        expect(submit).toBeDisabled();
        expect(submit).toHaveAttribute('type', 'submit');
        expect(submit).toHaveAttribute('aria-busy', 'true');
        expect(within(submit).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(within(submit).getByText('Save')).toBeInTheDocument();
    });

    it('[CLIENT-UI-ACT-004] / [FR-UI-ACT-004] indicates the primary action is unavailable when it is disabled', () => {
        renderDialog({
            primaryButtonLabel: 'Add tool',
            primaryButtonDisabled: true,
        });

        const dialog = screen.getByRole('dialog');
        const submit = within(dialog).getByRole('button', { name: 'Add tool' });

        expect(submit).toBeDisabled();
        expect(submit).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('Dialog block: controlled open', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('requests to close when the user activates the dialog close control', async () => {
        const onOpenChange = vi.fn();
        renderDialog({ onOpenChange, primaryButtonLabel: 'Done' });

        const dialog = screen.getByRole('dialog');
        await userEvent.click(within(dialog).getByRole('button', { name: /close/i }));

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('requests to close when the user activates the dismiss action', async () => {
        const onOpenChange = vi.fn();
        renderDialog({ onOpenChange, dismissLabel: 'Cancel', showCloseButton: false });

        const dialog = screen.getByRole('dialog');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('does not dismiss from the close control when dismissible is false', () => {
        renderDialog({ dismissible: false, primaryButtonLabel: 'Refresh session' });

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
});

describe('Dialog block: width', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('defaults to the sm width token', () => {
        renderDialog();

        expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-sm');
    });

    it('applies the requested width token', () => {
        renderDialog({ width: 'lg' });

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveClass('sm:max-w-lg');
        expect(dialog).not.toHaveClass('sm:max-w-sm');
    });
});

describe('Dialog block: header', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-TTL-005] / [FR-UI-TTL-001] names the dialog from the required title', () => {
        renderDialog({ title: 'Refresh session' });

        const dialog = screen.getByRole('dialog', { name: 'Refresh session' });
        expect(within(dialog).getByRole('heading', { name: 'Refresh session' })).toBeInTheDocument();
    });

    it('shows an optional visible description', () => {
        const description = 'Your session is about to expire.';

        renderDialog({ title: 'Refresh session', description });

        const dialog = screen.getByRole('dialog', { name: 'Refresh session' });
        expect(dialog).toHaveAccessibleDescription(description);
        expect(within(dialog).getByText(description)).toBeInTheDocument();
        expect(within(dialog).getByText(description)).not.toHaveClass('sr-only');
    });
});
