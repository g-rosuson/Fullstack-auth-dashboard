import Flex from '@/components/blocks/flex/Flex';

import type { ToastAddOptions, ToasterProps, ToastUpdateOptions } from './Toast.types';

import constants from './constants';
import ToastIcon from './ToastIcon';
import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { titleVariants } from '@/components/blocks/shared/variants/typography/title.variants';
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
import { cn } from '@/lib/utils';

function ToastList() {
    const { toasts } = useToastManager();

    return toasts.map(toastItem => (
        <Toast key={toastItem.id} toast={toastItem} className="rounded-lg bg-surface cursor-grab">
            <ToastContent className="gap-md">
                <ToastIcon type={toastItem.type} />

                <Flex direction="column" gap="sm" className="min-w-0">
                    <ToastTitle className={cn(titleVariants({ size: 'sm', spacing: 'none', weight: 'medium' }))} />
                    <ToastDescription className={textVariants({ size: 'sm', variant: 'muted' })} />
                </Flex>

                <ToastClose />
            </ToastContent>
        </Toast>
    ));
}

/**
 * Composes the shadcn toast with a product content model: title, description, type, and dismiss.
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

export default Toaster;

export type { ToastAddOptions, ToasterProps, ToastType, ToastUpdateOptions } from './Toast.types';
