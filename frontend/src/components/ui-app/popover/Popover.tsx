import { useCallback, useRef } from 'react';

import type { PopoverProps } from './Popover.types';

import { Popover as PopoverPrimitive, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Controlled wrapper around the shadcn Popover primitive.
 *
 * Open state is always owned by the caller (`open` + `onOpenChange`).
 *
 * Supports two trigger modes:
 * - `'click'`  — default; delegates open/close to Radix via `onOpenChange`.
 * - `'hover'`  — opens/closes on mouse enter/leave with configurable delays.
 *
 * @example Click mode
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <Popover open={open} onOpenChange={setOpen} trigger={<Button>Info</Button>} content={<Details />} />
 * ```
 *
 * @example Hover mode with a close grace period
 * ```tsx
 * <Popover
 *   triggerMode="hover"
 *   hoverCloseDelay={150}
 *   open={open}
 *   onOpenChange={setOpen}
 *   trigger={<InfoIcon />}
 *   content={<Tooltip />}
 * />
 * ```
 */
const Popover = ({
    trigger,
    content,
    triggerMode = 'click',
    open,
    onOpenChange,
    hoverOpenDelay = 0,
    hoverCloseDelay = 100,
    align = 'center',
    side,
    sideOffset,
    triggerClassName,
    contentClassName,
    asChild,
}: PopoverProps) => {
    // Refs
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Stable proxy for `onOpenChange` so downstream handlers can list it as a
     * dependency without re-creating on every render when the prop reference changes.
     * @param next - The desired open state to forward to the caller.
     */
    const setOpen = useCallback((next: boolean) => onOpenChange(next), [onOpenChange]);

    /** Cancels any in-flight open or close timer. */
    const clearTimers = () => {
        if (openTimerRef.current !== null) clearTimeout(openTimerRef.current);
        if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    };

    /**
     * Schedules the popover to open after `hoverOpenDelay` ms.
     * Cancels any pending close timer first so moving back onto the trigger
     * while the close is still counting down keeps the popover open.
     */
    const handleMouseEnter = () => {
        if (triggerMode !== 'hover') return;
        clearTimers();
        openTimerRef.current = setTimeout(() => setOpen(true), hoverOpenDelay);
    };

    /**
     * Schedules the popover to close after `hoverCloseDelay` ms.
     * The delay acts as a grace period — it allows the cursor to travel from
     * the trigger into the content panel without the popover snapping shut
     * during the brief moment neither element is under the pointer.
     */
    const handleMouseLeave = () => {
        if (triggerMode !== 'hover') return;
        clearTimers();
        closeTimerRef.current = setTimeout(() => setOpen(false), hoverCloseDelay);
    };

    return (
        // In click mode, Radix owns open/close via onOpenChange (e.g. outside clicks, Escape).
        // In hover mode, onOpenChange is omitted so Radix never overrides the timer-driven state.
        <PopoverPrimitive open={open} onOpenChange={triggerMode === 'click' ? setOpen : undefined}>
            <PopoverTrigger asChild={asChild} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {/* Wrapper span is needed to attach mouse events regardless of what `trigger` renders. */}
                <span className={cn('inline-flex', triggerClassName)}>{trigger}</span>
            </PopoverTrigger>

            {/* Mirror the hover handlers on the content panel so the close timer
                is reset if the cursor enters the popover before the delay expires. */}
            <PopoverContent
                align={align}
                side={side}
                sideOffset={sideOffset}
                className={cn('bg-muted', contentClassName)}
                onMouseEnter={triggerMode === 'hover' ? handleMouseEnter : undefined}
                onMouseLeave={triggerMode === 'hover' ? handleMouseLeave : undefined}
                onOpenAutoFocus={triggerMode === 'hover' ? e => e.preventDefault() : undefined}
                onCloseAutoFocus={triggerMode === 'hover' ? e => e.preventDefault() : undefined}>
                {content}
            </PopoverContent>
        </PopoverPrimitive>
    );
};

export default Popover;
