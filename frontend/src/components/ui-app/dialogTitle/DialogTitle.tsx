import React from 'react';
import { Dialog } from 'radix-ui';

import { HeadingVariants, headingVariants } from '../shared/variants/heading.variants';
import { TypographySpacing } from '../shared/variants/typography.spacing';
import { cn } from '@/lib/utils';

type DialogTitleProps = Omit<React.ComponentProps<typeof Dialog.Title>, 'size'> &
    Omit<HeadingVariants, 'size' | 'spacing'> & {
        size?: 'xs' | 'sm' | 'md' | 'lg';
        spacing?: keyof TypographySpacing;
    };

const DialogTitle = ({ className, size, spacing, variant, weight, ...props }: DialogTitleProps) => {
    return (
        <Dialog.Title
            data-slot="dialog-title"
            className={cn(headingVariants({ size, spacing, variant, weight }), className)}
            {...props}
        />
    );
};

DialogTitle.displayName = 'DialogTitle';

export default DialogTitle;
