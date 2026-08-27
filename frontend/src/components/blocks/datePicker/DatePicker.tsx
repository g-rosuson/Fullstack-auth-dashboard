import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import type { DatePickerProps } from './DatePicker.types';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn popover and calendar with a product content model: label, value, and required.
 */
const DatePicker = ({
    value,
    label,
    onChange,
    placeholder = 'Pick a date',
    disabled,
    required,
    name,
    error,
}: DatePickerProps) => {
    const [open, setOpen] = useState(false);
    const datePickerRef = useRef<HTMLInputElement>(null);
    const triggerId = name ? `${name}-field` : `date-picker-${label.toLowerCase().replace(/\s+/g, '-')}`;

    /**
     * Forwards the selected day and closes the calendar.
     */
    const onSelect = (date: Date | undefined) => {
        onChange(date ? date : null);
        setOpen(false);
    };

    /**
     * Native required validity lives on a hidden input because the trigger is a button.
     */
    useEffect(() => {
        if (!datePickerRef.current) return;

        const message = required && !value ? 'Please select a date to continue' : '';
        datePickerRef.current.setCustomValidity(message);
    }, [required, value]);

    return (
        <Field data-invalid={error ? true : undefined} className="gap-sm">
            <FieldLabel htmlFor={triggerId} className="gap-xs">
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={triggerId}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={error ? true : undefined}
                        className={cn(
                            'w-full justify-start font-normal border-input bg-muted hover:bg-muted-hover',
                            !value && 'text-muted-foreground'
                        )}>
                        <CalendarIcon />
                        {value ? format(value, 'PPP') : placeholder}

                        <input
                            ref={datePickerRef}
                            name={name}
                            type="text"
                            required={required}
                            value={value ? value.toString() : ''}
                            onChange={() => {}}
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden
                        />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 bg-surface hover:bg-surface-hover" align="start">
                    <Calendar mode="single" selected={value} onSelect={onSelect} autoFocus />
                </PopoverContent>
            </Popover>

            {error ? <FieldError>{error}</FieldError> : null}
        </Field>
    );
};

export default DatePicker;

export type { DatePickerProps } from './DatePicker.types';
