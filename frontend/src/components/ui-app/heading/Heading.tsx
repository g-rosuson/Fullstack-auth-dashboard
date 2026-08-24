import React from 'react';

import { headingVariants } from '../shared/variants/heading.variants';
import { HeadingProps } from './Heading.types';
import { cn } from '@/lib/utils';

const Heading = ({
    size,
    spacing,
    level,
    variant,
    weight,
    children,
    className,
    truncate = false,
}: HeadingProps) => {
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

    return (
        <Tag
            className={cn(
                headingVariants({ size, spacing, variant, weight }),
                className,
                'w-full',
                truncate && 'truncate'
            )}>
            {children}
        </Tag>
    );
};

Heading.displayName = 'Heading';

export default Heading;
