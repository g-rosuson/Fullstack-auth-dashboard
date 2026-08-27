import type { SelectProps } from './Select.types';
import type { ChangeEvent } from 'react';

import { chromeLabel } from '@/components/blocks/shared/variants/typography/recipes';
import { Field as FieldPrimitive, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn native select with a product content model: label, options, and value.
 */
const Select = <V extends string>({
    label,
    name,
    value,
    options,
    onChange,
    placeholder,
    disabled,
    error,
    className,
}: SelectProps<V>) => {
    const id = `${name}-field`;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selected = options.find(option => option.value === event.target.value);
        onChange(selected);
    };

    return (
        <FieldPrimitive data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id} className={cn(chromeLabel(), 'gap-xs')}>
                {label}
            </FieldLabel>

            <NativeSelect
                id={id}
                name={name}
                value={value}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                className={cn('w-full', className)}
                selectClassName={value === '' ? 'text-muted-foreground' : undefined}
                onChange={handleChange}>
                {placeholder !== undefined && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}

                {options.map(option => (
                    <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                    </NativeSelectOption>
                ))}
            </NativeSelect>

            {error ? <FieldError>{error}</FieldError> : null}
        </FieldPrimitive>
    );
};

export default Select;

export type { SelectOption, SelectProps } from './Select.types';
