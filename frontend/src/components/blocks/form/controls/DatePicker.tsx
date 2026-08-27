import DatePickerBlock from '@/components/blocks/datePicker/DatePicker';

import type { FormDateField } from '../Form.types';

/**
 * A labeled date picker aligned to the form field config.
 */
const DatePicker = ({ label, name, value, onChange, placeholder, required, disabled, error }: FormDateField) => {
    return (
        <DatePickerBlock
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            error={error}
        />
    );
};

export default DatePicker;
