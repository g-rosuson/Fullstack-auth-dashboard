import { cva } from 'class-variance-authority';

import Button from '@/components/blocks/button/Button';
import Flex from '@/components/ui-app/flex/Flex';

import type { SheetProps } from './Sheet.types';
import type { ReactNode } from 'react';

import { titleVariants } from '@/components/blocks/shared/variants/typography/title.variants';
import { Button as ButtonPrimitive } from '@/components/ui/button';
import {
    Sheet as SheetPrimitive,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

/**
 * Composes the shadcn sheet with a product content model: title, description, actions, and width.
 */
const Sheet = ({
    open,
    title,
    description,
    headerActions,
    children,
    className,
    formId,
    onPrimaryButtonClick,
    isSubmitting,
    primaryButtonLabel,
    side = 'right',
    width = 'sm',
    onOpenChange,
}: SheetProps) => {
    const submitsForm = !!formId;
    const isHorizontal = side === 'left' || side === 'right';

    let descriptionContent: ReactNode = null;

    if (description) {
        descriptionContent = <SheetDescription className="sr-only">{description}</SheetDescription>;
    }

    let primaryActionContent: ReactNode = null;

    if (primaryButtonLabel) {
        primaryActionContent = (
            <Button
                type={submitsForm ? 'submit' : 'button'}
                label={primaryButtonLabel}
                isLoading={isSubmitting}
                form={submitsForm ? formId : undefined}
                onClick={submitsForm ? undefined : onPrimaryButtonClick}
            />
        );
    }

    return (
        <SheetPrimitive open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={side}
                className={cn(
                    'flex flex-col justify-between overflow-scroll px-md pt-md',
                    isHorizontal && sheetWidthVariant({ width }),
                    className
                )}
                {...(description ? {} : { 'aria-describedby': undefined })}>
                <Flex direction="column" align="stretch" justify="between" className="h-full">
                    <Flex direction="column" align="stretch" gap="md">
                        <SheetHeader>
                            <Flex justify="between" align="center" gap="sm">
                                <SheetTitle className={cn(titleVariants({ size: 'lg' }), 'min-w-0 truncate')}>
                                    {title}
                                </SheetTitle>
                                {headerActions}
                            </Flex>
                            {descriptionContent}
                        </SheetHeader>
                        {children}
                    </Flex>

                    <SheetFooter className="sticky right-0 bottom-0 left-0 mt-lg -mx-md border-t bg-muted p-md">
                        <Flex direction="column" justify="end" align="stretch" gap="sm" className="sm:flex-row">
                            <SheetClose asChild>
                                <ButtonPrimitive variant="outline">Close</ButtonPrimitive>
                            </SheetClose>
                            {primaryActionContent}
                        </Flex>
                    </SheetFooter>
                </Flex>
            </SheetContent>
        </SheetPrimitive>
    );
};

export default Sheet;

export type { SheetProps } from './Sheet.types';
