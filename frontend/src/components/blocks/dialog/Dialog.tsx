import { cva } from 'class-variance-authority';

import Button from '@/components/blocks/button/Button';

import type { DialogProps } from './Dialog.types';
import type { ReactNode } from 'react';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { titleVariants } from '@/components/blocks/shared/variants/typography/title.variants';
import { Button as ButtonPrimitive } from '@/components/ui/button';
import {
    Dialog as DialogPrimitive,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const dialogWidthVariant = cva('', {
    variants: {
        width: {
            sm: 'sm:max-w-sm',
            md: 'sm:max-w-md',
            lg: 'sm:max-w-lg',
            xl: 'sm:max-w-xl',
        },
    },
    defaultVariants: { width: 'sm' },
});

/**
 * Composes the shadcn dialog with a product content model: title, description, body, and actions.
 */
const Dialog = ({
    open,
    title,
    description,
    children,
    className,
    formId,
    onPrimaryButtonClick,
    isSubmitting,
    primaryButtonLabel,
    primaryButtonVariant = 'default',
    primaryButtonDisabled,
    dismissLabel,
    showCloseButton = true,
    dismissible = true,
    width = 'sm',
    onOpenChange,
}: DialogProps) => {
    const submitsForm = !!formId;
    const canDismiss = dismissible;
    const closeButtonVisible = canDismiss && showCloseButton;

    let descriptionContent: ReactNode = null;

    if (description) {
        descriptionContent = (
            <DialogDescription className={textVariants({ size: 'sm', variant: 'muted' })}>
                {description}
            </DialogDescription>
        );
    }

    let primaryActionContent: ReactNode = null;

    if (primaryButtonLabel) {
        primaryActionContent = (
            <Button
                type={submitsForm ? 'submit' : 'button'}
                label={primaryButtonLabel}
                variant={primaryButtonVariant}
                isLoading={isSubmitting}
                disabled={primaryButtonDisabled}
                form={submitsForm ? formId : undefined}
                onClick={submitsForm ? undefined : onPrimaryButtonClick}
            />
        );
    }

    let dismissActionContent: ReactNode = null;

    if (dismissLabel) {
        dismissActionContent = (
            <DialogClose asChild>
                <ButtonPrimitive variant="outline" disabled={isSubmitting}>
                    {dismissLabel}
                </ButtonPrimitive>
            </DialogClose>
        );
    }

    let footerContent: ReactNode = null;

    if (dismissActionContent || primaryActionContent) {
        footerContent = (
            <DialogFooter className="sticky right-0 bottom-0 left-0">
                {dismissActionContent}
                {primaryActionContent}
            </DialogFooter>
        );
    }

    return (
        <DialogPrimitive open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={closeButtonVisible}
                onEscapeKeyDown={event => {
                    if (!canDismiss) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={event => {
                    if (!canDismiss) {
                        event.preventDefault();
                    }
                }}
                className={cn(dialogWidthVariant({ width }), className)}
                {...(description ? {} : { 'aria-describedby': undefined })}>
                <DialogHeader>
                    <DialogTitle className={cn(titleVariants({ size: 'md', spacing: 'none' }))}>{title}</DialogTitle>
                    {descriptionContent}
                </DialogHeader>
                {children}
                {footerContent}
            </DialogContent>
        </DialogPrimitive>
    );
};

export default Dialog;

export type { DialogProps } from './Dialog.types';
