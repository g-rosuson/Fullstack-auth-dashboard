import type { ButtonVariant } from '@/components/blocks/button/Button.types';
import type { MouseEventHandler, ReactNode } from 'react';

type DialogWidth = 'sm' | 'md' | 'lg' | 'xl';

type DialogProps = {
    open: boolean;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    className?: string;
    /**
     * Associates the primary action with a Form `id` so that button submits
     * and native-validates that form without wrapping the dialog in another `<form>`.
     */
    formId?: string;
    onPrimaryButtonClick?: MouseEventHandler<HTMLButtonElement>;
    isSubmitting?: boolean;
    primaryButtonLabel?: string;
    primaryButtonVariant?: ButtonVariant;
    primaryButtonDisabled?: boolean;
    dismissLabel?: string;
    showCloseButton?: boolean;
    dismissible?: boolean;
    width?: DialogWidth;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
};

export type { DialogProps, DialogWidth };
