import React from 'react';

import Spinner from '@/components/ui-app/spinner/Spinner';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Sheet as SheetPrimitive, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface SheetProps {
    open: boolean;
    ariaDescribedby: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    children: React.ReactNode;
    className?: string;
    enableForm?: boolean;
    // eslint-disable-next-line no-unused-vars
    onFormSubmit?: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
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
    enableForm,
    onFormSubmit,
    onPrimaryButtonClick,
    isSubmitting,
    primaryButtonLabel,
    ariaDescribedby,
    side = 'right',
    onOpenChange,
}: SheetProps) => {
    /**
     * Handles the submit event for the form.
     * @param e - The form event.
     */
    const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        onFormSubmit?.(e);
    };

    // Determine the sheet footer
    const sheetFooter = (
        <div
            data-slot="sheet-footer"
            className="sticky bottom-0 left-0 right-0 flex flex-col justify-end gap-2 mt-6 -mx-4 border-t bg-muted p-4 sm:flex-row">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>

            {primaryButtonLabel && (
                <Button
                    type={enableForm ? 'submit' : 'button'}
                    variant="default"
                    disabled={isSubmitting}
                    {...(!enableForm && { onClick: e => onPrimaryButtonClick?.(e) })}>
                    {isSubmitting ? <Spinner /> : primaryButtonLabel}
                </Button>
            )}
        </div>
    );

    // Determine the inner content
    const layoutClassName = 'h-full flex flex-col justify-between';

    const content = React.createElement(
        enableForm ? 'form' : 'div',
        {
            className: layoutClassName,
            ...(enableForm ? { onSubmit } : {}),
        },
        children,
        sheetFooter
    );

    return (
        <SheetPrimitive open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className={cn('min-w-[60%] flex flex-col justify-between px-4 pt-4 overflow-scroll', className)}
                side={side}>
                {content}
                <DialogDescription className="sr-only">{ariaDescribedby}</DialogDescription>
            </SheetContent>
        </SheetPrimitive>
    );
};

export default Sheet;

export type { SheetProps };
