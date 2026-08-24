import React from 'react';

import { HeadingVariants } from '../shared/variants/heading.variants';

type Level = 1 | 2 | 3 | 4;

type HeadingProps = Omit<HeadingVariants, 'size'> & {
    level: Level;
    children: React.ReactNode;
    variant?: 'muted' | 'foreground';
    weight?: 'bold' | 'medium' | 'regular' | 'light' | 'thin';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
    removeMargin?: boolean;
    truncate?: boolean;
};

export type { HeadingProps };
