import { useState } from 'react';

import Button from '@/components/blocks/button/Button';

import type { ConfirmationDialogProps } from './ConfirmationDialog.types';
import type { ReactNode } from 'react';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { titleVariants } from '@/components/blocks/shared/variants/typography/title.variants';
import { Button as ButtonPrimitive } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn dialog with a product content model: title, description, and confirm action.
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

    let descriptionContent: ReactNode = null;

    if (description) {
        descriptionContent = (
            <DialogDescription className={textVariants({ size: 'sm', variant: 'muted' })}>
                {description}
            </DialogDescription>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} {...(description ? {} : { 'aria-describedby': undefined })}>
                <DialogHeader>
                    <DialogTitle className={cn(titleVariants({ size: 'md', spacing: 'none' }))}>{title}</DialogTitle>
                    {descriptionContent}
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <ButtonPrimitive variant="outline" disabled={isConfirming}>
                            Cancel
                        </ButtonPrimitive>
                    </DialogClose>
                    <Button
                        label={confirmLabel}
                        variant={confirmVariant}
                        isLoading={isConfirming}
                        onClick={handleConfirm}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationDialog;

export type { ConfirmationDialogProps } from './ConfirmationDialog.types';
