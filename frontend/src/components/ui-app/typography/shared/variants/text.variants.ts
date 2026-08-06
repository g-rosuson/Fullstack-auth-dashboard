import { cva, VariantProps } from 'class-variance-authority';

type TextVariants = VariantProps<typeof textVariants>;

const textVariants = cva('text-base', {
    variants: {
        size: {
            xl: 'text-xl font-black',
            l: 'text-lg',
            m: 'text-base',
            s: 'text-sm',
            xs: 'text-xs',
        },
        weight: {
            bold: 'font-bold',
            medium: 'font-medium',
            regular: 'font-normal',
            light: 'font-light',
            thin: 'font-thin',
        },
        align: {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        },
        appearance: {
            primary: 'text-primary-foreground',
            destructive: 'text-destructive-foreground',
            warning: 'text-warning-foreground',
            success: 'text-success-foreground',
            muted: 'text-muted-foreground',
            foreground: 'text-foreground',
        },
    },
    defaultVariants: {
        size: 'm',
        appearance: 'foreground',
        weight: 'medium',
        align: 'left',
    },
});

export { textVariants };

export type { TextVariants };
