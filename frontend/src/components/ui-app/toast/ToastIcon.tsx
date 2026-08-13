import { CircleCheckIcon, CircleXIcon, InfoIcon, MegaphoneIcon } from 'lucide-react';

import Spinner from '@/components/ui-app/spinner/Spinner';

import type { ToastIconProps, ToastType } from './Toast.types';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const iconClassName = "shrink-0 [&_svg:not([class*='size-'])]:size-4";

const toastIcons: Record<ToastType, { icon: ReactNode; className?: string }> = {
    success: {
        icon: <CircleCheckIcon aria-hidden="true" />,
        className: 'text-success',
    },
    info: {
        icon: <InfoIcon aria-hidden="true" />,
        className: 'text-muted-foreground',
    },
    warning: {
        icon: <MegaphoneIcon aria-hidden="true" />,
        className: 'text-warning',
    },
    error: {
        icon: <CircleXIcon aria-hidden="true" />,
        className: 'text-destructive',
    },
    loading: {
        icon: <Spinner type="circle" size="s" className="size-4" aria-hidden="true" />,
    },
};

/**
 * Status icon for a toast type. Default (undefined / unknown) renders nothing.
 */
const ToastIcon = ({ type }: ToastIconProps) => {
    if (!type || !(type in toastIcons)) {
        return null;
    }

    const { icon, className } = toastIcons[type as ToastType];

    return (
        <span data-slot="toast-icon" className={cn(iconClassName, className)}>
            {icon}
        </span>
    );
};

export default ToastIcon;
