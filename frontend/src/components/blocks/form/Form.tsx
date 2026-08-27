import DatePicker from './controls/DatePicker';
import Field from './controls/Field';
import RadioGroup from './controls/RadioGroup';
import Select from './controls/Select';
import Flex from '@/components/blocks/flex/Flex';

import type { FormControlField, FormField, FormGroup, FormProps } from './Form.types';
import type { ReactNode, SubmitEvent as ReactSubmitEvent } from 'react';

import { FieldLegend, FieldSet } from '@/components/ui/field';

/**
 * Renders one labeled control from the field config.
 */
const renderControl = (field: FormControlField) => {
    switch (field.type) {
        case 'select':
            return <Select {...field} />;
        case 'date':
            return <DatePicker {...field} />;
        case 'radio':
            return <RadioGroup {...field} />;
        default:
            return <Field {...field} />;
    }
};

/**
 * Renders a control or a row of controls.
 */
const renderField = (field: FormField, index: number) => {
    if (field.type === 'row') {
        return (
            <Flex key={`row-${index}`} direction="column" gap="md" className="w-full sm:flex-row">
                {field.fields.map(control => (
                    <div key={control.name} className="w-full">
                        {renderControl(control)}
                    </div>
                ))}
            </Flex>
        );
    }

    return (
        <div key={field.name} className="w-full">
            {renderControl(field)}
        </div>
    );
};

/**
 * Stacks groups, then optional trailing children.
 */
const renderBody = (groups: FormGroup[], children: ReactNode) => (
    <Flex direction="column" gap="md">
        {groups.map((group, index) => (
            <FieldSet key={group.legend ?? index} className="w-full">
                {group.legend && <FieldLegend className="mb-sm">{group.legend}</FieldLegend>}

                <Flex direction="column" gap="md">
                    {group.fields?.map((field, fieldIndex) => renderField(field, fieldIndex))}

                    {group.children}
                </Flex>
            </FieldSet>
        ))}
        {children}
    </Flex>
);

/**
 * Walks a groups config into fieldsets and labeled controls.
 */
const Form = (props: FormProps) => {
    const body = renderBody(props.groups, props.children);

    if (props.as === 'div') {
        return body;
    }

    const onSubmit = (event: ReactSubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        props.onSubmit(event);
    };

    return (
        <form id={props.id} aria-label={props.ariaLabel} className="w-full" onSubmit={onSubmit}>
            {body}
        </form>
    );
};

export default Form;
