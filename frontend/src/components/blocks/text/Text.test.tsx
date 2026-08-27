import { render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';

import Text from './Text';

/**
 * Margin utilities applied to text, used to compare spacing without pinning a default step.
 */
const marginClasses = (element: HTMLElement) => [...element.classList].filter(className => className.startsWith('mb-'));

describe('Text block: copy', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders a paragraph by default', () => {
        render(<Text>Body copy</Text>);

        const copy = screen.getByText('Body copy');
        expect(copy.tagName).toBe('P');
        expect(copy).toHaveTextContent('Body copy');
    });

    it('renders the requested element', () => {
        render(<Text as="span">Inline copy</Text>);

        expect(screen.getByText('Inline copy').tagName).toBe('SPAN');
    });
});

describe('Text block: type scale', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('keeps the same default spacing when size changes', () => {
        render(
            <>
                <Text size="lg">Large text</Text>
                <Text size="sm">Small text</Text>
            </>
        );
        const large = screen.getByText('Large text');
        const small = screen.getByText('Small text');

        expect(large).toHaveClass('text-lg');
        expect(small).toHaveClass('text-sm');
        expect(marginClasses(large)).toEqual(marginClasses(small));
    });

    it('applies an explicit spacing step without changing size', () => {
        render(
            <Text size="sm" spacing="md">
                Spaced text
            </Text>
        );
        const text = screen.getByText('Spaced text');
        expect(text).toHaveClass('text-sm');
        expect(marginClasses(text)).toEqual(['mb-md']);
    });
});
