import type { RadioGroupProps } from './RadioGroup.types';

import { chromeLabel, surfaceDescription } from '@/components/blocks/shared/variants/typography/recipes';
import { Field as FieldPrimitive, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup as RadioGroupPrimitive, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn radio group with a product content model: labelled options and a group name.
 */
const RadioGroup = <V extends string>({ label, name, value, items, onChange, disabled, error }: RadioGroupProps<V>) => {
    const labelId = `${name}-label`;

    return (
        <FieldPrimitive data-invalid={error ? true : undefined}>
            <FieldLabel id={labelId} className={cn(chromeLabel(), 'gap-xs')}>
                {label}
            </FieldLabel>

            <RadioGroupPrimitive
                value={value}
                name={name}
                disabled={disabled}
                aria-labelledby={labelId}
                aria-invalid={error ? true : undefined}
                onValueChange={nextValue => onChange(nextValue as V)}>
                {items.map(item => {
                    const id = `${name}-${item.value}`;
                    const isDisabled = disabled || item.disabled;

                    return (
                        <FieldPrimitive key={item.value} orientation="horizontal" data-disabled={isDisabled}>
                            <RadioGroupItem value={item.value} id={id} disabled={isDisabled} />

                            <FieldContent>
                                <FieldLabel htmlFor={id} className={chromeLabel()}>
                                    {item.label}
                                </FieldLabel>
                                {item.description ? (
                                    <FieldDescription className={surfaceDescription()}>
                                        {item.description}
                                    </FieldDescription>
                                ) : null}
                            </FieldContent>
                        </FieldPrimitive>
                    );
                })}
            </RadioGroupPrimitive>

            {error ? <FieldError>{error}</FieldError> : null}
        </FieldPrimitive>
    );
};

export default RadioGroup;

export type { RadioGroupItemConfig, RadioGroupProps } from './RadioGroup.types';
