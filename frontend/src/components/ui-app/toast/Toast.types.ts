import type { ReactNode } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

type ToasterProps = {
    children?: ReactNode;
};

export type { ToastType, ToasterProps };
