import React from 'react';

import { HeadingVariants } from '../shared/variants/heading.variants';

type Level = 1 | 2 | 3 | 4;

type HeadingProps = HeadingVariants & {
    level: Level;
    children: React.ReactNode;
    appearance?: 'muted' | 'foreground';
    weight?: 'bold' | 'medium' | 'regular' | 'light' | 'thin';
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    className?: string;
    removeMargin?: boolean;
    truncate?: boolean;
};

export type { HeadingProps };
