import type { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ComponentProps, ReactNode } from 'react';

type PopoverTriggerMode = 'click' | 'hover';

type PopoverProps = {
    trigger: ReactNode;
    content: ReactNode;
    triggerMode?: PopoverTriggerMode;
    open: boolean;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
    hoverOpenDelay?: number;
    hoverCloseDelay?: number;
    align?: ComponentProps<typeof PopoverContent>['align'];
    side?: ComponentProps<typeof PopoverContent>['side'];
    sideOffset?: number;
    triggerClassName?: string;
    contentClassName?: string;
    asChild?: ComponentProps<typeof PopoverTrigger>['asChild'];
};

export type { PopoverProps, PopoverTriggerMode };
