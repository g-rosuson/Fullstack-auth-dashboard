import type { ButtonVariant } from '@/components/blocks/button/Button.types';

type ConfirmationDialogProps = {
    open: boolean;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    onConfirm: () => Promise<void>;
    confirmLabel?: string;
    confirmVariant?: ButtonVariant;
};

export type { ConfirmationDialogProps };
