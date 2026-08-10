import { MouseEvent, ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { Slot } from 'radix-ui';

import Text from '@/components/ui-app/typography/text/Text';

import mappers from '@/components/pages/jobs/components/jobsList/mappers';

import type { ActionType, JobStatus } from '@/components/pages/jobs/components/jobsList/types';
import type { ComponentProps } from 'react';

import constants from '@/components/pages/jobs/components/jobsList/constants';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
    {
        variants: {
            variant: {
                primary: 'bg-primary text-white hover:bg-primary/90 [a]:hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:border-destructive-foreground focus-visible:ring-destructive/30',
                warning:
                    'bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:border-warning-foreground focus-visible:ring-warning/30',
                success:
                    'bg-success text-success-foreground hover:bg-success/90 focus-visible:border-success-foreground focus-visible:ring-success/30',

                // TODO: Keep all?
                link: 'text-primary underline-offset-4 hover:underline',
                outline: 'border-border bg-surface hover:bg-surface-hover',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
                ghost: 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
            },
            size: {
                xs: "p-2 gap-1 rounded-[min(var(--radius-md),10px)] text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                s: "p-2.5 gap-2 rounded-[min(var(--radius-md),12px)] text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                m: "p-3.5 gap-3 rounded-[min(var(--radius-md),12px)] text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
                l: 'p-4.5 gap-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 's',
        },
    }
);

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
    variant?: 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'warning' | 'success';
    size?: 'xs' | 's' | 'm' | 'l';
    label?: string;
    ariaLabel?: string;
    asChild?: boolean;
    // TODO: Used?
    rounded?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = ({
    className,
    variant,
    size,
    isLoading,
    ariaLabel,
    asChild = false,
    fullWidth = false,
    ...props
}: ButtonProps) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
        <Comp
            disabled={isLoading}
            aria-disabled={isLoading}
            aria-busy={isLoading}
            aria-label={ariaLabel}
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
            {...props}
        />
    );
};

const ActionButton = ({
    status,
    size = 'xs',
    isLoading,
    onClick,
}: {
    status: JobStatus;
    size?: 'xs' | 's' | 'l';
    isLoading: boolean;
    // eslint-disable-next-line no-unused-vars
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) => {
    const action = mappers.mapToActionType(status);

    const actionToIconMap = {
        stop: <Square fill="currentColor" />,
        pause: <Pause fill="currentColor" />,
        activate: <Play fill="currentColor" />,
        run: <Play fill="currentColor" />,
        retry: <RotateCcw fill="currentColor" />,
    } as const satisfies Record<ActionType, ReactElement>;

    const actionToVariantMap = {
        stop: 'destructive',
        pause: 'primary',
        activate: 'warning',
        run: 'primary',
        retry: 'destructive',
    } as const satisfies Record<ActionType, 'primary' | 'destructive' | 'warning' | 'success'>;

    const actionToLabelMap = {
        ...constants.label.action.execution,
        ...constants.label.action.schedule,
    } as const satisfies Record<ActionType, string>;

    const iconElement = actionToIconMap[action];
    const variant = actionToVariantMap[action];
    const label = actionToLabelMap[action];

    return (
        <Button size={size} variant={variant} isLoading={isLoading} onClick={onClick}>
            {iconElement}

            <Text size={size} variant={variant}>
                {label}
            </Text>
        </Button>
    );
};

export default ActionButton;
