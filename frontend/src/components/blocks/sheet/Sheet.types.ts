import type { MouseEventHandler, ReactNode } from 'react';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

type SheetWidth = 'sm' | 'md' | 'lg' | 'xl';

type SheetProps = {
    open: boolean;
    title: ReactNode;
    description?: string;
    headerActions?: ReactNode;
    side?: SheetSide;
    width?: SheetWidth;
    children: ReactNode;
    className?: string;
    /**
     * Associates the primary action with a Form `id` so that button submits
     * and native-validates that form without wrapping the sheet in another `<form>`.
     */
    formId?: string;
    onPrimaryButtonClick?: MouseEventHandler<HTMLButtonElement>;
    isSubmitting?: boolean;
    primaryButtonLabel?: string;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
};

export type { SheetProps, SheetSide, SheetWidth };
