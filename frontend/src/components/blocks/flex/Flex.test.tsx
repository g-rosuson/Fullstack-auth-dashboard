import { render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';

import Flex from './Flex';

describe('Flex block: layout', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('defaults to a full-width row with the sm gap token', () => {
        render(<Flex>Row</Flex>);

        const row = screen.getByText('Row');
        expect(row.tagName).toBe('DIV');
        expect(row).toHaveClass('flex', 'flex-row', 'gap-sm', 'w-full');
    });

    it('applies column direction and the requested gap token', () => {
        render(
            <Flex direction="column" gap="md">
                Column
            </Flex>
        );

        expect(screen.getByText('Column')).toHaveClass('flex-col', 'gap-md');
    });

    it('renders the requested element', () => {
        render(<Flex as="section">Section</Flex>);

        expect(screen.getByText('Section').tagName).toBe('SECTION');
    });
});
