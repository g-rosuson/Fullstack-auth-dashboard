import { render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';

import Grid from './Grid';

describe('Grid block: columns', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('applies a fixed column count and the md gap token by default', () => {
        render(<Grid columns={2}>Cell</Grid>);

        const grid = screen.getByText('Cell');
        expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-md');
    });

    it('applies the requested gap token', () => {
        render(
            <Grid columns={3} gap="sm">
                Cell
            </Grid>
        );

        expect(screen.getByText('Cell')).toHaveClass('gap-sm');
    });
});

describe('Grid block: fluid tracks', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('sizes columns from minItemWidth instead of a fixed count', () => {
        render(<Grid minItemWidth="md">Cell</Grid>);

        const grid = screen.getByText('Cell');
        expect(grid).toHaveClass('grid', 'grid-cols-autofill-md', 'gap-md');
        expect(grid).not.toHaveClass('grid-cols-3');
    });
});
