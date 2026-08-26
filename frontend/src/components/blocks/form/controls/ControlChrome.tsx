import type { ReactNode } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';

type ControlChromeProps = {
    label: string;
    htmlFor?: string;
    labelId?: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
};

/**
 * Shared label, required marker, and error chrome for a form control.
 */
const ControlChrome = ({ label, htmlFor, labelId, required, error, children }: ControlChromeProps) => {
    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={htmlFor} id={labelId} className="gap-xs">
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>

            {children}

            {error ? <FieldError>{error}</FieldError> : null}
        </Field>
    );
};

export default ControlChrome;
