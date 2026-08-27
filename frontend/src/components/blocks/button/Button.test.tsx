import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Plus } from 'lucide-react';
import { afterEach } from 'vitest';

import Button from './Button';

describe('Button block: content', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] renders a labelled button', () => {
        render(<Button label="Save" />);

        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] renders an icon-only button named from ariaLabel', () => {
        render(<Button icon={<Home />} ariaLabel="Home" />);

        const button = screen.getByRole('button', { name: 'Home' });

        expect(button.querySelector('svg')).toBeInTheDocument();
        expect(within(button).queryByText('Home')).not.toBeInTheDocument();
    });

    it('renders an icon and a label together', () => {
        render(<Button icon={<Plus />} label="Add tool" />);

        const button = screen.getByRole('button', { name: 'Add tool' });

        expect(button.querySelector('svg')).toBeInTheDocument();
        expect(within(button).getByText('Add tool')).toBeInTheDocument();
    });
});

describe('Button block: loading', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-002] / [FR-UI-ACT-002] disables the button and exposes a busy state while loading', () => {
        render(<Button label="Save" isLoading />);

        const button = screen.getByRole('button');

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(within(button).getByText('Save')).toBeInTheDocument();
    });

    it('[CLIENT-UI-ACT-002] / [FR-UI-ACT-002] does not invoke onClick while loading', async () => {
        const onClick = vi.fn();

        render(<Button label="Save" isLoading onClick={onClick} />);

        await userEvent.click(screen.getByRole('button'));

        expect(onClick).not.toHaveBeenCalled();
    });
});

describe('Button block: width and size', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('stays inline by default and stretches when fullWidth is set', () => {
        const { rerender } = render(<Button label="Save" />);

        expect(screen.getByRole('button')).not.toHaveClass('w-full');

        rerender(<Button label="Save" fullWidth />);

        expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('forwards size to the primitive', () => {
        render(<Button icon={<Plus />} ariaLabel="Create job" size="lg" />);

        expect(screen.getByRole('button', { name: 'Create job' })).toHaveAttribute('data-size', 'lg');
    });
});

describe('Button block: interaction', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('invokes onClick when activated', async () => {
        const onClick = vi.fn();

        render(<Button label="Save" onClick={onClick} />);

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onClick when disabled', async () => {
        const onClick = vi.fn();

        render(<Button label="Save" disabled onClick={onClick} />);

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onClick).not.toHaveBeenCalled();
    });

    it('[CLIENT-UI-ACT-004] / [FR-UI-ACT-004] shows unavailable appearance and pointer when disabled', () => {
        render(<Button label="Save" disabled />);

        const button = screen.getByRole('button', { name: 'Save' });

        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50');
        expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('[CLIENT-UI-ACT-003] / [FR-UI-ACT-003] submits the form when type is submit', async () => {
        const onSubmit = vi.fn(event => event.preventDefault());

        render(
            <form onSubmit={onSubmit}>
                <Button type="submit" label="Sign in" />
            </form>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('[CLIENT-UI-ACT-003] / [FR-UI-ACT-003] defaults type to button so it does not submit a parent form', async () => {
        const onSubmit = vi.fn(event => event.preventDefault());

        render(
            <form onSubmit={onSubmit}>
                <Button label="Cancel" />
            </form>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
