import type { ChangeEventHandler } from 'react';

type FieldProps = {
    label: string;
    name: string;
    type: 'text' | 'email' | 'password' | 'number' | 'time';
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
};

export type { FieldProps };
