import type { ReactNode } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

type ToastIconProps = {
    type?: string;
};

type ToasterProps = {
    children?: ReactNode;
};

export type { ToastType, ToastIconProps, ToasterProps };
