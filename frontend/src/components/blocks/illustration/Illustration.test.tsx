import { render } from '@testing-library/react';
import { afterEach } from 'vitest';

import illustrations from './Illustration';

describe('Illustration block: catalog', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the not-found illustration as an svg', () => {
        const { container } = render(<illustrations.NotFound />);

        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
