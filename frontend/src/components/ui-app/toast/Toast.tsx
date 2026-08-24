import ToastIcon from './toastIcon/ToastIcon';
import Flex from '@/components/ui-app/flex/Flex';

import type { ToastAddOptions, ToasterProps, ToastUpdateOptions } from './Toast.types';

import constants from './constants';
import {
    Toast,
    toast as toastManager,
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
        <Toast key={toastItem.id} toast={toastItem} className="border border-border rounded-lg bg-surface cursor-grab">
            <ToastContent>
                <Flex gap="md">
                    <ToastIcon type={toastItem.type} />

                    <Flex direction="column" gap="sm">
                        <Flex direction="column" gap="md">
                            <Flex direction="column" gap="sm">
                                <ToastTitle />
                                <ToastDescription />
                            </Flex>
                        </Flex>
                    </Flex>

                    <ToastClose />
                </Flex>
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

export { toast, Toaster, constants };
