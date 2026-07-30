import React from 'react';

import { headingVariants } from '../shared/variants/heading.variants';
import { HeadingProps } from './Heading.types';
import { cn } from '@/lib/utils';

const Heading = ({
    size,
    level,
    appearance,
    weight,
    children,
    className,
    removeMargin = false,
    truncate = false,
}: HeadingProps) => {
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

    return (
        <Tag
            className={cn(
                headingVariants({ size, appearance, weight }),
                className,
                'w-full',
                removeMargin && 'mb-0',
                truncate && 'truncate'
            )}>
            {children}
        </Tag>
    );
};

Heading.displayName = 'Heading';

export default Heading;
