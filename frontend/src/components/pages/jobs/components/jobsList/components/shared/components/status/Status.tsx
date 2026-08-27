import { cva } from 'class-variance-authority';

import Flex from '@/components/blocks/flex/Flex';
import Spinner from '@/components/blocks/spinner/Spinner';
import Text from '@/components/blocks/text/Text';

import type { JobStatus } from '@/components/pages/jobs/components/jobsList/types';

import jobConstants from '@/components/pages/jobs/constants';
import { cn } from '@/lib/utils';

const statusIndicatorVariants = cva('rounded-full', {
    variants: {
        variant: {
            primary: 'bg-primary-foreground',
            destructive: 'bg-destructive-foreground',
            warning: 'bg-warning-foreground',
            success: 'bg-success-foreground',
            muted: 'bg-muted-foreground',
        },
        size: {
            xs: 'size-1.5',
            sm: 'size-2',
        },
    },
    defaultVariants: {
        variant: 'muted',
        size: 'xs',
    },
});

interface StatusProps {
    status: JobStatus;
    size?: 'xs' | 'sm';
}

const Status = ({ status, size = 'xs' }: StatusProps) => {
    const statusToVariantMap = {
        running: 'primary',
        active: 'success',
        paused: 'warning',
        inactive: 'muted',
        missing: 'destructive',
    } as const satisfies Record<JobStatus, 'primary' | 'destructive' | 'warning' | 'success' | 'muted'>;

    const variant = statusToVariantMap[status];
    const label = jobConstants.label.status[status];

    let indicator = <div className={cn(statusIndicatorVariants({ variant, size }))} />;

    if (status === jobConstants.key.status.running) {
        indicator = <Spinner size={size} variant={variant} />;
    }

    return (
        <Flex
            align="center"
            gap={size === 'sm' ? 'sm' : 'xs'}
            className={`w-fit px-sm py-xs rounded-full bg-${variant}`}>
            {indicator}

            <Text size={size} variant={variant} weight="medium">
                {label}
            </Text>
        </Flex>
    );
};

export default Status;
