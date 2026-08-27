type SelectOption<V extends string = string> = {
    value: V;
    label: string;
};

type SelectProps<V extends string = string> = {
    label: string;
    name: string;
    value: V | string;
    options: ReadonlyArray<SelectOption<V>>;
    // eslint-disable-next-line no-unused-vars
    onChange: (option: SelectOption<V> | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
};

export type { SelectOption, SelectProps };
