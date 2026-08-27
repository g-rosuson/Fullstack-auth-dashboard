import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import Placeholder from './Placeholder';

const PLACEHOLDER_MESSAGE = 'No jobs exist yet, create your first job to get started.';

/**
 * Mock the illustration so tests stay focused on Placeholder behaviour
 * without asserting on SVG path details.
 */
vi.mock('@/components/blocks/illustration/Illustration', () => ({
    default: {
        NotFound: () => <svg aria-label="Not found illustration" />,
    },
}));

/**
 * Mock the openFormSheet function.
 */
const openFormSheet = vi.fn();

/**
 * Render the Placeholder component.
 */
const renderComponent = () => render(<Placeholder openFormSheet={openFormSheet} />);

describe('Placeholder: content', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('renders the empty state message', () => {
        renderComponent();

        expect(screen.getByText(PLACEHOLDER_MESSAGE)).toBeInTheDocument();
    });

    it('renders the not-found illustration', () => {
        renderComponent();

        expect(screen.getByLabelText('Not found illustration')).toBeInTheDocument();
    });

    it('renders the create job button', () => {
        renderComponent();

        expect(screen.getByRole('button', { name: 'Create job' })).toBeInTheDocument();
    });
});

describe('Placeholder: user interactions', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('calls openFormSheet when the create button is clicked', async () => {
        renderComponent();

        await userEvent.click(screen.getByRole('button', { name: 'Create job' }));

        expect(openFormSheet).toHaveBeenCalledTimes(1);
    });
});
