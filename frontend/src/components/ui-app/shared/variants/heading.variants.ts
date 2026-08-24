import { cva, VariantProps } from 'class-variance-authority';

type HeadingVariants = VariantProps<typeof headingVariants>;

const headingVariants = cva('mb-sm text-xl', {
    variants: {
        size: {
            xl: 'mb-lg text-4xl font-black',
            l: 'mb-3 text-xl',
            m: 'mb-sm text-base',
            s: 'mb-xs text-sm',
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
        size: 'm',
        variant: 'foreground',
        weight: 'bold',
    },
});

export { headingVariants };

export type { HeadingVariants };
