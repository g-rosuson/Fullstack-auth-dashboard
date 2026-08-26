import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { CardProps } from './Card';
import type { ReactNode } from 'react';

import Card from './Card';

const renderCard = (props: Partial<CardProps> & { children?: ReactNode } = {}) => {
    return render(
        <Card
            title={props.title ?? 'Card title'}
            titleSize={props.titleSize}
            titleAddon={props.titleAddon}
            description={props.description}
            headerActions={props.headerActions}
            footer={props.footer}
            className={props.className}
            onClick={props.onClick}>
            {props.children ?? <p>Card body</p>}
        </Card>
    );
};

describe('Card block: chrome', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the required title as a heading', () => {
        renderCard({ title: 'Login' });

        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });

    it('shows an optional visible description', () => {
        renderCard({
            title: 'Login',
            description: 'Sign in to your account.',
        });

        expect(screen.getByText('Sign in to your account.')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your account.')).not.toHaveClass('sr-only');
    });

    it('renders trailing header actions', () => {
        renderCard({
            title: 'Nightly scrape',
            headerActions: <button type="button">Job actions</button>,
        });

        expect(screen.getByRole('button', { name: 'Job actions' })).toBeInTheDocument();
    });

    it('renders a title addon below the heading without including it in the heading name', () => {
        renderCard({
            title: 'Nightly scrape',
            titleAddon: <span>Active</span>,
        });

        expect(screen.getByRole('heading', { name: 'Nightly scrape' })).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Nightly scrape' })).not.toHaveTextContent('Active');
    });

    it('renders an optional footer', () => {
        renderCard({
            footer: <a href="/register">Register</a>,
        });

        expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    });
});

describe('Card block: interaction', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('invokes onClick from the card surface', async () => {
        const onClick = vi.fn();
        renderCard({ onClick });

        await userEvent.click(screen.getByRole('heading', { name: 'Card title' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onClick when a header action is activated', async () => {
        const onClick = vi.fn();
        renderCard({
            onClick,
            headerActions: <button type="button">Job actions</button>,
        });

        await userEvent.click(screen.getByRole('button', { name: 'Job actions' }));

        expect(onClick).not.toHaveBeenCalled();
    });
});

describe('Card block: titleSize', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('defaults the title to the lg token', () => {
        renderCard({ title: 'Login' });

        expect(screen.getByRole('heading', { name: 'Login' })).toHaveClass('text-xl');
    });

    it('applies the requested titleSize', () => {
        renderCard({ titleSize: 'sm', title: 'Nightly scrape' });

        expect(screen.getByRole('heading', { name: 'Nightly scrape' })).toHaveClass('text-sm');
    });
});
