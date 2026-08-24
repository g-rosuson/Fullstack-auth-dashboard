import React from 'react';
import { PlusIcon, XIcon } from 'lucide-react';

import Text from '@/components/ui-app/text/Text';

import type { KeyWordsFieldProps } from './types/KeywordsField.types';

import constants from '@/components/pages/jobs/components/jobFormSheet/constants';
import { Button } from '@/components/ui/button';
import { Field as ShadcnField, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

/**
 * A field component for keywords.
 * @todo Look into more natural replacement for this component
 */
const KeyWordsField: React.FC<KeyWordsFieldProps> = ({
    label,
    required,
    name,
    value,
    placeholder,
    keywords,
    hasKeywords,
    onKeyDown,
    onChange,
    onClick,
    onKeywordRemove,
}) => {
    // Ref
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Input ID
    const id = `${name}-field`;

    // Programmatically set the validity of the input element based whether its required and has keywords
    const isValid = required && !hasKeywords ? constants.label.field.keywords.error : '';
    inputRef.current?.setCustomValidity(isValid);

    /**
     * Handles the click event for the remove keyword button.
     */
    const onKeywordRemoveClick = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        onKeywordRemove(index);
    };

    return (
        <div>
            <ShadcnField>
                <FieldLabel htmlFor={id} className="gap-xs">
                    {label}
                    {required && <span className="text-destructive">{constants.label.field.keywords.asterisk}</span>}
                </FieldLabel>

                <InputGroup>
                    <InputGroupInput
                        ref={inputRef}
                        id={id}
                        name={name}
                        value={value}
                        placeholder={placeholder}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        aria-required={required}
                    />

                    <InputGroupAddon align="inline-end">
                        <InputGroupButton variant="default" onClick={onClick}>
                            <PlusIcon />
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </ShadcnField>

            <div className="flex flex-wrap gap-sm border rounded-md p-sm mt-xs" hidden={keywords.length === 0}>
                {keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-center gap-xs rounded-md bg-primary pl-sm">
                        <Text size="xs" variant="foreground">
                            {keyword}
                        </Text>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Remove keyword"
                            className="p-0"
                            onClick={e => onKeywordRemoveClick(e, index)}>
                            <XIcon />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KeyWordsField;
