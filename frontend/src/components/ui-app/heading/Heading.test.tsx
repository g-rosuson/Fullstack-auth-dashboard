import { render, screen } from '@testing-library/react';

import Heading from './Heading';

/**
 * Margin utilities applied to a heading, used to compare spacing without pinning a default step.
 */
const marginClasses = (element: HTMLElement) => [...element.classList].filter(className => className.startsWith('mb-'));

describe('Heading component', () => {
    it('renders the correct heading tag based on the "level" prop', () => {
        render(<Heading level={1}>Heading 1</Heading>);
        expect(screen.getByText('Heading 1').tagName).toBe('H1');

        render(<Heading level={2}>Heading 2</Heading>);
        expect(screen.getByText('Heading 2').tagName).toBe('H2');

        render(<Heading level={3}>Heading 3</Heading>);
        expect(screen.getByText('Heading 3').tagName).toBe('H3');
    });

    it('merges the className prop without overriding base styles', () => {
        // size="lg" has no font-weight variant, so the base font-bold survives tailwind-merge
        render(
            <Heading level={1} size="lg" className="mt-md">
                Heading with margin
            </Heading>
        );
        const heading = screen.getByText('Heading with margin');
        expect(heading).toHaveClass('mt-md');
        expect(heading).toHaveClass('font-bold');
    });

    it('keeps the same default spacing when size changes', () => {
        render(
            <>
                <Heading level={1} size="lg">
                    Large heading
                </Heading>
                <Heading level={2} size="sm">
                    Small heading
                </Heading>
            </>
        );
        const large = screen.getByText('Large heading');
        const small = screen.getByText('Small heading');

        expect(large).toHaveClass('text-xl');
        expect(small).toHaveClass('text-sm');
        expect(marginClasses(large)).toEqual(marginClasses(small));
    });

    it('applies spacing="none" without changing size', () => {
        render(
            <Heading level={2} size="sm" spacing="none">
                No margin
            </Heading>
        );
        const heading = screen.getByText('No margin');
        expect(heading).toHaveClass('text-sm');
        expect(marginClasses(heading)).toEqual(['mb-0']);
    });

    it('applies an explicit spacing step without changing size', () => {
        render(
            <Heading level={1} size="lg" spacing="md">
                Spaced heading
            </Heading>
        );
        const heading = screen.getByText('Spaced heading');
        expect(heading).toHaveClass('text-xl');
        expect(marginClasses(heading)).toEqual(['mb-md']);
    });
});
