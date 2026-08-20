import { cva, VariantProps } from 'class-variance-authority';

type HeadingVariants = VariantProps<typeof headingVariants>;

const headingVariants = cva('mb-2 text-xl', {
    variants: {
        size: {
            xl: 'mb-6 text-4xl font-black',
            l: 'mb-3 text-xl',
            m: 'mb-2 text-base',
            s: 'mb-1 text-sm',
            xs: 'mb-1 text-xs',
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
