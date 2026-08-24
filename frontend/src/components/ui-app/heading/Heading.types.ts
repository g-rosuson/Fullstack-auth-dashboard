import React from 'react';

import { HeadingVariants } from '../shared/variants/heading.variants';
import { TypographySpacing } from '../shared/variants/typography.spacing';

type Level = 1 | 2 | 3 | 4;

type HeadingProps = Omit<HeadingVariants, 'size' | 'spacing'> & {
    level: Level;
    children: React.ReactNode;
    variant?: 'muted' | 'foreground';
    weight?: 'bold' | 'medium' | 'regular' | 'light' | 'thin';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    spacing?: keyof TypographySpacing;
    className?: string;
    truncate?: boolean;
};

export type { HeadingProps };
