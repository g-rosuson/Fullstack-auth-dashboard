/**
 * The props for the Indicator component.
 */
interface IndicatorProps {
    /** Whether the item passed screening — controls the dot colour. */
    passed: boolean;
    /** Reason codes surfaced in the hover popover. */
    reasonCodes: string[];
}

export type { IndicatorProps };
