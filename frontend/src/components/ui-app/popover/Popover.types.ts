import type { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type React from 'react';

/**
 * Controls how the popover opens — click (default Radix behaviour) or hover.
 */
type PopoverTriggerMode = 'click' | 'hover';

/**
 * The props for the Popover wrapper component.
 * Open state is always controlled by the caller via `open` + `onOpenChange`.
 */
interface PopoverProps {
    /** The element that opens the popover. */
    trigger: React.ReactNode;
    /** The content rendered inside the popover panel. */
    content: React.ReactNode;
    /** Whether the popover opens on click or on hover. Defaults to 'click'. */
    triggerMode?: PopoverTriggerMode;
    /** Controlled open state — always required. */
    open: boolean;
    /** Called when the open state should change. */
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
    /** Delay in ms before the popover opens on hover. Defaults to 0. */
    hoverOpenDelay?: number;
    /** Delay in ms before the popover closes on hover-leave. Defaults to 100. */
    hoverCloseDelay?: number;
    align?: React.ComponentProps<typeof PopoverContent>['align'];
    side?: React.ComponentProps<typeof PopoverContent>['side'];
    sideOffset?: number;
    /** Extra classes forwarded to the trigger wrapper span. */
    triggerClassName?: string;
    /** Extra classes forwarded to PopoverContent. */
    contentClassName?: string;
    /** Forwarded to PopoverTrigger — useful for asChild patterns. */
    asChild?: React.ComponentProps<typeof PopoverTrigger>['asChild'];
}

export type { PopoverProps, PopoverTriggerMode };
