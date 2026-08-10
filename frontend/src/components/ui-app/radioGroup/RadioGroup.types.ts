/**
 * A single radio option rendered by the RadioGroup component.
 */
interface RadioGroupItemConfig<V extends string = string> {
    value: V;
    label: string;
    description?: string;
    disabled?: boolean;
    id?: string;
}

/**
 * The props for the RadioGroup component.
 */
interface RadioGroupProps<V extends string> {
    items: ReadonlyArray<RadioGroupItemConfig<V>>;
    value?: V;
    defaultValue?: V;
    // eslint-disable-next-line no-unused-vars
    onValueChange: (value: V) => void;
    className?: string;
    disabled?: boolean;
}

export type { RadioGroupItemConfig, RadioGroupProps };
