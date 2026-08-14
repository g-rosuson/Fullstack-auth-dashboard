import type { ToastManagerAddOptions, ToastManagerUpdateOptions } from '@base-ui/react/toast';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

type WithToastType<T> = Omit<T, 'type'> & { type?: ToastType };

type ToastAddOptions = WithToastType<ToastManagerAddOptions<object>>;
type ToastUpdateOptions = WithToastType<ToastManagerUpdateOptions<object>>;

type ToasterProps = {
    children?: ReactNode;
};

export type { ToastAddOptions, ToasterProps, ToastType, ToastUpdateOptions };
