import { cva, VariantProps } from 'class-variance-authority';

import { typographySpacing } from './typography.spacing';

type HeadingVariants = VariantProps<typeof headingVariants>;

const headingVariants = cva('', {
    variants: {
        size: {
            lg: 'text-xl',
            md: 'text-base',
            sm: 'text-sm',
            xs: 'text-xs',
        },
        spacing: typographySpacing,
        weight: {
            bold: 'font-bold',
            medium: 'font-medium',
            regular: 'font-normal',
            light: 'font-light',
            thin: 'font-thin',
        },
        variant: {
            muted: 'text-muted-foreground',
            foreground: 'text-foreground',
        },
    },
    defaultVariants: {
        size: 'md',
        spacing: 'xs',
        variant: 'foreground',
        weight: 'bold',
    },
});

export { headingVariants };

export type { HeadingVariants };
