import Spinner from '@/components/ui-app/spinner/Spinner';

import type { ButtonProps } from './Button.types';

import { Button as ShadcnButton } from '@/components/ui/button';

const Button = (props: ButtonProps) => {
    const { type, size, variant, disabled, hidden, isLoading, icon, ariaLabel, label, onClick } = props;

    const content = icon ?? label ?? null;

    return (
        <ShadcnButton
            className="p-sm"
            type={type}
            variant={variant}
            size={size || 'default'}
            onClick={isLoading ? undefined : onClick}
            disabled={disabled || isLoading}
            hidden={hidden}
            aria-disabled={disabled || isLoading}
            aria-hidden={hidden}
            aria-busy={isLoading}
            aria-label={ariaLabel}>
            {isLoading ? <Spinner /> : content}
        </ShadcnButton>
    );
};

export default Button;
