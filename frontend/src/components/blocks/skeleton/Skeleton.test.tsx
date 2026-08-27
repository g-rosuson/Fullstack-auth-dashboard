import { render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';

import Skeleton from './Skeleton';

describe('Skeleton block: placeholder', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-SKL-001] / [FR-UI-SKL-001] shows a loading placeholder', () => {
        render(<Skeleton data-testid="skeleton" />);

        const placeholder = screen.getByTestId('skeleton');
        expect(placeholder).toHaveAttribute('data-slot', 'skeleton');
        expect(placeholder).toHaveClass('animate-pulse');
    });
});
