import RadioGroupBlock from '@/components/blocks/radioGroup/RadioGroup';

import type { FormRadioField } from '../Form.types';

/**
 * A labeled radio group aligned to the form field config.
 */
const RadioGroup = ({ label, name, value, items, onChange, disabled, error }: FormRadioField) => {
    return (
        <RadioGroupBlock
            label={label}
            name={name}
            value={value}
            items={items}
            onChange={onChange}
            disabled={disabled}
            error={error}
        />
    );
};

export default RadioGroup;
