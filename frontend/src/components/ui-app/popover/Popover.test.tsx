import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PopoverProps } from './Popover.types';

import Popover from './Popover';

/**
 * Renders Popover into the JS-DOM with sensible defaults.
 * Pass `onOpenChange` explicitly in tests that need to assert on it.
 */
const renderPopover = (overrides: Partial<PopoverProps> = {}) => {
    const props: PopoverProps = {
        open: false,
        onOpenChange: vi.fn(),
        trigger: <span>Trigger</span>,
        content: <span>Popover content</span>,
        ...overrides,
    };
    return render(<Popover {...props} />);
};

describe('Popover: rendering', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the trigger content', () => {
        renderPopover();

        expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('does not render popover content when open is false', () => {
        renderPopover({ open: false });

        expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });

    it('renders popover content when open is true', () => {
        renderPopover({ open: true });

        expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
});

describe('Popover: click mode', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls onOpenChange(true) when the trigger is clicked and the popover is closed', async () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'click', onOpenChange, open: false });

        await userEvent.click(screen.getByRole('button'));

        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange(false) when the trigger is clicked and the popover is open', async () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'click', onOpenChange, open: true });

        await userEvent.click(screen.getByRole('button'));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onOpenChange when the trigger is hovered in click mode', () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'click', onOpenChange });

        fireEvent.mouseEnter(screen.getByRole('button'));

        expect(onOpenChange).not.toHaveBeenCalled();
    });
});

describe('Popover: hover mode', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('calls onOpenChange(true) only after hoverOpenDelay elapses on mouseenter', () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'hover', onOpenChange, hoverOpenDelay: 50 });

        fireEvent.mouseEnter(screen.getByRole('button'));

        vi.advanceTimersByTime(49);
        expect(onOpenChange).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange(false) only after hoverCloseDelay elapses on mouseleave', () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'hover', onOpenChange, hoverCloseDelay: 100 });

        fireEvent.mouseLeave(screen.getByRole('button'));

        vi.advanceTimersByTime(99);
        expect(onOpenChange).not.toHaveBeenCalledWith(false);

        vi.advanceTimersByTime(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('cancels the close timer when the cursor moves into the content panel before the delay expires', () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'hover', onOpenChange, open: true, hoverCloseDelay: 100 });

        const contentPanel = screen.getByText('Popover content').closest('[data-slot="popover-content"]')!;

        // Cursor leaves the trigger, starting the close countdown
        fireEvent.mouseLeave(screen.getByRole('button'));
        vi.advanceTimersByTime(50);

        // Cursor reaches the content panel before the delay expires
        fireEvent.mouseEnter(contentPanel);
        vi.advanceTimersByTime(100);

        expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('does not call onOpenChange when the trigger is clicked in hover mode', () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'hover', onOpenChange });

        fireEvent.click(screen.getByRole('button'));

        expect(onOpenChange).not.toHaveBeenCalled();
    });
});
