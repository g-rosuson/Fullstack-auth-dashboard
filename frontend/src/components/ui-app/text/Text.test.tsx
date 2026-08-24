import { render, screen } from '@testing-library/react';

import Text from './Text';

/**
 * Margin utilities applied to text, used to compare spacing without pinning a default step.
 */
const marginClasses = (element: HTMLElement) => [...element.classList].filter(className => className.startsWith('mb-'));

describe('Text component', () => {
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
