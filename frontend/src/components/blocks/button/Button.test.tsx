import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Plus } from 'lucide-react';
import { afterEach } from 'vitest';

import Button from './Button';

// TODO: Are we adding NFR's or other docs?

describe('Button block: content', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders a labelled button', () => {
        render(<Button label="Save" />);

        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders an icon-only button named from ariaLabel', () => {
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

    it('disables the button and exposes a busy state while loading', () => {
        render(<Button label="Save" isLoading />);

        const button = screen.getByRole('button');

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(within(button).getByText('Save')).toBeInTheDocument();
    });

    it('does not invoke onClick while loading', async () => {
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

    it('submits the form when type is submit', async () => {
        const onSubmit = vi.fn(event => event.preventDefault());

        render(
            <form onSubmit={onSubmit}>
                <Button type="submit" label="Sign in" />
            </form>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('defaults type to button so it does not submit a parent form', async () => {
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
