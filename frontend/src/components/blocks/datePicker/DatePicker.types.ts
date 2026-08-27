/**
 * The props for the DatePicker content model.
 */
type DatePickerProps = {
    value: Date | undefined;
    label: string;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    error?: string;
};

export type { DatePickerProps };
