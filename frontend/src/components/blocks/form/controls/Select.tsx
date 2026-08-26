import type { FormSelectField } from '../Form.types';
import type { ChangeEvent } from 'react';

import ControlChrome from './ControlChrome';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

/**
 * A labeled native select aligned to the form field config.
 */
const Select = ({ label, name, value, options, onChange, placeholder, disabled, error }: FormSelectField) => {
    const id = `${name}-field`;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selected = options.find(option => option.value === event.target.value);
        onChange(selected);
    };

    return (
        <ControlChrome label={label} htmlFor={id} error={error}>
            <NativeSelect
                id={id}
                name={name}
                value={value}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                className="w-full"
                selectClassName={value === '' ? 'text-muted-foreground' : undefined}
                onChange={handleChange}>
                {placeholder !== undefined && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}

                {options.map(option => (
                    <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
        </ControlChrome>
    );
};

export default Select;
