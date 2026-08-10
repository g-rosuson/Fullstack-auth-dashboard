import React from 'react';
import { cva } from 'class-variance-authority';
import { Loader, Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('', {
    variants: {
        size: {
            l: 'size-8',
            m: 'size-6',
            s: 'size-3',
            xs: 'size-2',
        },
        variant: {
            primary: 'text-primary-foreground',
            foreground: 'text-foreground',
            muted: 'text-muted-foreground',
            success: 'text-success-foreground',
            warning: 'text-warning-foreground',
            destructive: 'text-destructive-foreground',
        },
        speed: {
            slow: 'animate-[spin_1.5s_linear_infinite]',
            medium: 'animate-spin', // default 1s
            fast: 'animate-[spin_0.5s_linear_infinite]',
        },
    },
    defaultVariants: {
        size: 'm',
        variant: 'foreground',
        speed: 'medium',
    },
});

type SpinnerProps = React.ComponentProps<'svg'> & {
    size?: 'xs' | 's' | 'm' | 'l';
    type?: 'circle' | 'dotted';
    variant?: 'primary' | 'foreground' | 'muted' | 'success' | 'warning' | 'destructive';
    speed?: 'slow' | 'medium' | 'fast';
};

function Spinner({ size, type = 'circle', variant, speed, className }: SpinnerProps) {
    const iconMap = {
        circle: Loader2Icon,
        dotted: Loader,
    };
    const Icon = iconMap[type];

    return (
        <Icon role="status" aria-label="Loading" className={cn(spinnerVariants({ size, variant, speed }), className)} />
    );
}

export default Spinner;
