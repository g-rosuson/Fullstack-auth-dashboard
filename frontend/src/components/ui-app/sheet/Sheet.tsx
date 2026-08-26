import React from 'react';
import { cva } from 'class-variance-authority';

import Flex from '../flex/Flex';
import Spinner from '@/components/ui-app/spinner/Spinner';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Sheet as SheetPrimitive, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const sheetWidthVariant = cva('', {
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

interface SheetProps {
    open: boolean;
    ariaDescribedby: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    width?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    className?: string;
    /**
     * Associates the primary action with a Form `id` so that button submits
     * and native-validates that form without wrapping the sheet in another `<form>`.
     */
    formId?: string;
    // eslint-disable-next-line no-unused-vars
    onPrimaryButtonClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    isSubmitting?: boolean;
    primaryButtonLabel?: string;
    secondaryLabel?: string;
    onSecondaryClick?: () => void;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
}

const Sheet = ({
    open,
    children,
    className,
    formId,
    onPrimaryButtonClick,
    isSubmitting,
    primaryButtonLabel,
    ariaDescribedby,
    side = 'right',
    width = 'sm',
    onOpenChange,
}: SheetProps) => {
    const submitsForm = !!formId;
    const isHorizontal = side === 'left' || side === 'right';

    // Determine the sheet footer
    const sheetFooter = (
        <div data-slot="sheet-footer" className="sticky bottom-0 left-0 right-0 mt-lg -mx-md border-t bg-muted p-md">
            <Flex direction="column" justify="end" align="stretch" gap="sm" className="sm:flex-row">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>

                {primaryButtonLabel && (
                    <Button
                        type={submitsForm ? 'submit' : 'button'}
                        variant="default"
                        disabled={isSubmitting}
                        {...(submitsForm && { form: formId })}
                        {...(!submitsForm && { onClick: e => onPrimaryButtonClick?.(e) })}>
                        {isSubmitting ? <Spinner /> : primaryButtonLabel}
                    </Button>
                )}
            </Flex>
        </div>
    );

    return (
        <SheetPrimitive open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className={cn(
                    'flex flex-col justify-between px-md pt-md overflow-scroll',
                    isHorizontal && sheetWidthVariant({ width }),
                    className
                )}
                side={side}>
                <Flex direction="column" align="stretch" justify="between" className="h-full">
                    {children}
                    {sheetFooter}
                </Flex>
                <DialogDescription className="sr-only">{ariaDescribedby}</DialogDescription>
            </SheetContent>
        </SheetPrimitive>
    );
};

export default Sheet;

export type { SheetProps };
