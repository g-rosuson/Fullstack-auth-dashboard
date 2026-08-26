import type { FormTextField } from '../Form.types';

import ControlChrome from './ControlChrome';
import { Input } from '@/components/ui/input';

/**
 * A labeled text input aligned to the form field config.
 */
const Field = ({ label, name, type, value, onChange, placeholder, required, disabled, error }: FormTextField) => {
    const id = `${name}-field`;

    return (
        <ControlChrome label={label} htmlFor={id} required={required} error={error}>
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
        </ControlChrome>
    );
};

export default Field;
