import React from 'react';
import { Dialog } from 'radix-ui';

import { HeadingVariants, headingVariants } from '../shared/variants/heading.variants';
import { cn } from '@/lib/utils';

type DialogTitleProps = React.ComponentProps<typeof Dialog.Title> & HeadingVariants;

const DialogTitle = ({ className, size, variant, weight, ...props }: DialogTitleProps) => {
    return (
        <Dialog.Title
            data-slot="dialog-title"
            className={cn(headingVariants({ size, variant, weight }), className)}
            {...props}
        />
    );
};

DialogTitle.displayName = 'DialogTitle';

export default DialogTitle;
