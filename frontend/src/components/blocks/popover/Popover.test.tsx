import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';

import type { PopoverProps } from './Popover.types';

import Popover from './Popover';

/**
 * Renders Popover into the JS-DOM with sensible defaults.
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

describe('Popover block: visibility', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-ACT-001] / [FR-UI-ACT-001] renders the trigger', () => {
        renderPopover();

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('[CLIENT-UI-POP-001] / [FR-UI-POP-001] does not show panel content when the panel is closed', () => {
        renderPopover({ open: false });

        expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });

    it('[CLIENT-UI-POP-001] / [FR-UI-POP-001] shows panel content when the panel is open', () => {
        renderPopover({ open: true });

        expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
});

describe('Popover block: click', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-POP-001] / [FR-UI-POP-001] requests the panel to open when the trigger is activated', async () => {
        const onOpenChange = vi.fn();
        renderPopover({ triggerMode: 'click', onOpenChange, open: false });

        await userEvent.click(screen.getByRole('button'));

        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('[CLIENT-UI-POP-001] / [FR-UI-POP-001] requests the panel to close when the trigger is activated while open', async () => {
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

describe('Popover block: hover', () => {
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

        fireEvent.mouseLeave(screen.getByRole('button'));
        vi.advanceTimersByTime(50);

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
