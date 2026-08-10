import type { RadioGroupProps } from './RadioGroup.types';

import { Field as ShadcnField, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * A radio group that maps over a config array of labeled options.
 */
const RadioGroup = <V extends string>({
    items,
    value,
    defaultValue,
    onValueChange,
    className,
    disabled,
}: RadioGroupProps<V>) => {
    return (
        <ShadcnRadioGroup
            value={value}
            defaultValue={defaultValue}
            className={className}
            onValueChange={nextValue => onValueChange(nextValue as V)}
            disabled={disabled}>
            {items.map(item => {
                const id = item.id ?? `radio-${item.value}`;
                const isDisabled = disabled || item.disabled;

                return (
                    <ShadcnField key={item.value} orientation="horizontal" data-disabled={isDisabled}>
                        <RadioGroupItem value={item.value} id={id} disabled={isDisabled} />

                        <FieldContent>
                            <FieldLabel htmlFor={id}>{item.label}</FieldLabel>

                            {item.description && <FieldDescription>{item.description}</FieldDescription>}
                        </FieldContent>
                    </ShadcnField>
                );
            })}
        </ShadcnRadioGroup>
    );
};

export default RadioGroup;
