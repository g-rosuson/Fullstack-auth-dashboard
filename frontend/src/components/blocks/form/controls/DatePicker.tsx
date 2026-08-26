import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import type { FormDateField } from '../Form.types';

import ControlChrome from './ControlChrome';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * A labeled date picker aligned to the form field config.
 */
const DatePicker = ({
    label,
    name,
    value,
    onChange,
    placeholder = 'Pick a date',
    required,
    disabled,
    error,
}: FormDateField) => {
    const [open, setOpen] = useState(false);
    const datePickerRef = useRef<HTMLInputElement>(null);
    const id = `${name}-field`;

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
        <ControlChrome label={label} htmlFor={id} required={required} error={error}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
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
        </ControlChrome>
    );
};

export default DatePicker;
