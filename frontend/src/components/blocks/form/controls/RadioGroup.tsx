import type { FormRadioField } from '../Form.types';

import ControlChrome from './ControlChrome';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * A labeled radio group aligned to the form field config.
 */
const RadioGroup = ({ label, name, value, items, onChange, disabled, error }: FormRadioField) => {
    const labelId = `${name}-label`;

    return (
        <ControlChrome label={label} labelId={labelId} error={error}>
            <ShadcnRadioGroup
                value={value}
                name={name}
                disabled={disabled}
                aria-labelledby={labelId}
                aria-invalid={error ? true : undefined}
                onValueChange={onChange}>
                {items.map(item => {
                    const id = `${name}-${item.value}`;
                    const isDisabled = disabled || item.disabled;

                    return (
                        <Field key={item.value} orientation="horizontal" data-disabled={isDisabled}>
                            <RadioGroupItem value={item.value} id={id} disabled={isDisabled} />

                            <FieldContent>
                                <FieldLabel htmlFor={id}>{item.label}</FieldLabel>
                                {item.description && <FieldDescription>{item.description}</FieldDescription>}
                            </FieldContent>
                        </Field>
                    );
                })}
            </ShadcnRadioGroup>
        </ControlChrome>
    );
};

export default RadioGroup;
