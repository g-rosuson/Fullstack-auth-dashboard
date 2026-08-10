import { useState } from 'react';
import { VisuallyHidden } from 'radix-ui';

import Spinner from '@/components/ui-app/spinner/Spinner';

import type { ConfirmationDialogProps } from './ConfirmationDialog.types';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
            onOpenChange();
        } catch {
            onOpenChange();
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription size="s">
                        {description ?? <VisuallyHidden.Root>{title}</VisuallyHidden.Root>}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isConfirming}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button variant={confirmVariant} onClick={handleConfirm} disabled={isConfirming}>
                        {isConfirming ? <Spinner /> : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationDialog;
