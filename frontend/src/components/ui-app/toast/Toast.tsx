import ToastIcon from './toastIcon/ToastIcon';

import type { ToastAddOptions, ToasterProps, ToastUpdateOptions } from './Toast.types';

import {
    Toast,
    toast as toastManager,
    ToastAction,
    ToastClose,
    ToastContent,
    ToastDescription,
    ToastPortal,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    useToastManager,
} from '@/components/ui/toast';

function ToastList() {
    const { toasts } = useToastManager();

    return toasts.map(toastItem => (
        <Toast key={toastItem.id} toast={toastItem}>
            <ToastContent>
                <ToastIcon type={toastItem.type} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <ToastTitle />
                    <ToastDescription />
                </div>
                {toastItem.actionProps ? <ToastAction /> : null}
                <ToastClose />
            </ToastContent>
        </Toast>
    ));
}

/**
 * App toast shell — mounts the Base UI toast provider and viewport once.
 */
function Toaster({ children }: ToasterProps) {
    return (
        <ToastProvider toastManager={toastManager}>
            {children}
            <ToastPortal>
                <ToastViewport>
                    <ToastList />
                </ToastViewport>
            </ToastPortal>
        </ToastProvider>
    );
}

const toast = {
    add: (options: ToastAddOptions) => toastManager.add(options),
    close: toastManager.close.bind(toastManager),
    update: (id: string, options: ToastUpdateOptions) => toastManager.update(id, options),
    promise: toastManager.promise.bind(toastManager),
};

export { toast, Toaster };
