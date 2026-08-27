import { useState } from 'react';

import Dialog from '@/components/blocks/dialog/Dialog';

import type { ConfirmationDialogProps } from './ConfirmationDialog.types';

/**
 * Composes the dialog block with a confirm/dismiss content model.
 */
const ConfirmationDialog = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmLabel = 'Confirm',
    confirmVariant = 'default',
}: ConfirmationDialogProps) => {
    const [isConfirming, setIsConfirming] = useState(false);

    /**
     * Awaits the onConfirm callback and closes the dialog when it settles.
     */
    const handleConfirm = async () => {
        try {
            setIsConfirming(true);
            await onConfirm();
            onOpenChange(false);
        } catch {
            onOpenChange(false);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            primaryButtonLabel={confirmLabel}
            primaryButtonVariant={confirmVariant}
            isSubmitting={isConfirming}
            onPrimaryButtonClick={handleConfirm}
            dismissLabel="Cancel"
            showCloseButton={false}
        />
    );
};

export default ConfirmationDialog;

export type { ConfirmationDialogProps } from './ConfirmationDialog.types';
