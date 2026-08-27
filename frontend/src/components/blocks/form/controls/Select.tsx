import SelectBlock from '@/components/blocks/select/Select';

import type { FormSelectField } from '../Form.types';

/**
 * A labeled native select aligned to the form field config.
 */
const Select = ({ label, name, value, options, onChange, placeholder, disabled, error }: FormSelectField) => {
    return (
        <SelectBlock
            label={label}
            name={name}
            value={value}
            options={options}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
        />
    );
};

export default Select;
