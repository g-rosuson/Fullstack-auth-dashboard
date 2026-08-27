type RadioGroupItemConfig<V extends string = string> = {
    value: V;
    label: string;
    description?: string;
    disabled?: boolean;
};

type RadioGroupProps<V extends string = string> = {
    label: string;
    name: string;
    value: V;
    items: ReadonlyArray<RadioGroupItemConfig<V>>;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: V) => void;
    disabled?: boolean;
    error?: string;
};

export type { RadioGroupItemConfig, RadioGroupProps };
