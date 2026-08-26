import type { ChangeEventHandler, ReactNode, SubmitEvent as ReactSubmitEvent } from 'react';

/**
 * Shared chrome for every labeled control in a form group.
 */
type FieldBase = {
    label: string;
    name: string;
    disabled?: boolean;
    error?: string;
};

/**
 * A select or radio option.
 */
type FormOption<V extends string = string> = {
    value: V;
    label: string;
};

/**
 * A text-like input control.
 */
type FormTextField = FieldBase & {
    type: 'text' | 'email' | 'password' | 'number' | 'time';
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    required?: boolean;
};

/**
 * A native select control.
 */
type FormSelectField = FieldBase & {
    type: 'select';
    value: string;
    options: ReadonlyArray<FormOption>;
    // eslint-disable-next-line no-unused-vars
    onChange: (option: FormOption | undefined) => void;
    placeholder?: string;
};

/**
 * A date picker control.
 */
type FormDateField = FieldBase & {
    type: 'date';
    value: Date | undefined;
    // eslint-disable-next-line no-unused-vars
    onChange: (date: Date | null) => void;
    placeholder?: string;
    required?: boolean;
};

/**
 * A radio group control. Item labels are the options; `label` names the group.
 */
type FormRadioField = FieldBase & {
    type: 'radio';
    value: string;
    items: ReadonlyArray<FormOption & { description?: string; disabled?: boolean }>;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: string) => void;
};

/**
 * A labeled control (not a row).
 */
type FormControlField = FormTextField | FormSelectField | FormDateField | FormRadioField;

/**
 * A field in a group: a labeled control or a row of controls.
 */
type FormField = FormControlField | { type: 'row'; fields: FormControlField[] };

/**
 * A semantic fieldset. `legend` is omitted for an unlabeled group.
 */
type FormGroup = {
    legend?: string;
    fields?: FormField[];
    children?: ReactNode;
};

/**
 * Shared Form props.
 */
type FormBaseProps = {
    groups: FormGroup[];
    children?: ReactNode;
};

/**
 * Form as a native `<form>`. Default `as`. Form preventDefaults then calls `onSubmit`.
 * Pass `id` so a submit control outside the form (Sheet footer) can target it via `form={id}`.
 */
type FormAsFormProps = FormBaseProps & {
    as?: 'form';
    id?: string;
    ariaLabel: string;
    // eslint-disable-next-line no-unused-vars
    onSubmit: (event: ReactSubmitEvent<HTMLFormElement>) => void | Promise<void>;
};

/**
 * Form as a `div` when an ancestor already is the submitting `<form>`.
 */
type FormAsDivProps = FormBaseProps & {
    as: 'div';
};

type FormProps = FormAsFormProps | FormAsDivProps;

export type {
    FieldBase,
    FormControlField,
    FormDateField,
    FormField,
    FormGroup,
    FormOption,
    FormProps,
    FormRadioField,
    FormSelectField,
    FormTextField,
};
