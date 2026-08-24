import { cva, VariantProps } from 'class-variance-authority';

type HeadingVariants = VariantProps<typeof headingVariants>;

const headingVariants = cva('mb-sm text-xl', {
    variants: {
        size: {
            lg: 'mb-md text-xl',
            md: 'mb-sm text-base',
            sm: 'mb-xs text-sm',
            xs: 'mb-xs text-xs',
        },
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
        variant: 'foreground',
        weight: 'bold',
    },
});

export { headingVariants };

export type { HeadingVariants };
