import type { FieldProps } from './Field.types';

import { chromeLabel } from '@/components/blocks/shared/variants/typography/recipes';
import { Field as FieldPrimitive, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn field and input with a product content model: label, value, and required.
 */
const Field = ({ label, name, type, value, onChange, placeholder, required, disabled, error }: FieldProps) => {
    const id = `${name}-field`;

    return (
        <FieldPrimitive data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id} className={cn(chromeLabel(), 'gap-xs')}>
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>

            <Input
                id={id}
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                onChange={onChange}
                className={value === '' ? 'text-muted-foreground' : undefined}
            />

            {error ? <FieldError>{error}</FieldError> : null}
        </FieldPrimitive>
    );
};

export default Field;

export type { FieldProps } from './Field.types';
