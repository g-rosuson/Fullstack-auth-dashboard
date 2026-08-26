import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { FormTextField } from './Form.types';

import Form from './Form';

const textField = (label: string, value = ''): FormTextField => ({
    type: 'text',
    name: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    value,
    placeholder: label,
    onChange: vi.fn(),
});

describe('Form', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders a form by default and calls onSubmit after preventDefault', async () => {
        const onSubmit = vi.fn();
        render(
            <Form ariaLabel="Test form" groups={[{ fields: [textField('Email')] }]} onSubmit={onSubmit}>
                <button type="submit">Save</button>
            </Form>
        );

        const form = screen.getByRole('form', { name: 'Test form' });
        expect(form.tagName).toBe('FORM');

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][0].defaultPrevented).toBe(true);
    });

    it('lets an external submit control target the form by id and skips onSubmit when required fields are empty', async () => {
        const onSubmit = vi.fn();
        render(
            <>
                <Form
                    id="external-form"
                    ariaLabel="Test form"
                    groups={[{ fields: [{ ...textField('Email'), required: true }] }]}
                    onSubmit={onSubmit}
                />
                <button type="submit" form="external-form">
                    Save
                </button>
            </>
        );

        const form = screen.getByRole('form', { name: 'Test form' });
        expect(form).toHaveAttribute('id', 'external-form');

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByLabelText(/email/i)).toBeInvalid();
    });

    it('submits through an external control associated by form id when fields are valid', async () => {
        const onSubmit = vi.fn();
        render(
            <>
                <Form
                    id="external-form"
                    ariaLabel="Test form"
                    groups={[{ fields: [textField('Email', 'ada@example.com')] }]}
                    onSubmit={onSubmit}
                />
                <button type="submit" form="external-form">
                    Save
                </button>
            </>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][0].defaultPrevented).toBe(true);
    });

    it('renders a div with no form when as is div', () => {
        render(<Form as="div" groups={[{ fields: [textField('Email')] }]} />);

        expect(screen.queryByRole('form')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('omits a legend when the group has none', () => {
        render(<Form ariaLabel="Test form" groups={[{ fields: [textField('Email')] }]} onSubmit={vi.fn()} />);

        expect(screen.queryByText('Schedule')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders a fieldset legend when the group has one', () => {
        render(
            <Form
                ariaLabel="Test form"
                groups={[{ legend: 'Schedule', fields: [textField('Type')] }]}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByRole('group', { name: 'Schedule' })).toBeInTheDocument();
    });

    it('lays out row fields together', () => {
        render(
            <Form
                ariaLabel="Test form"
                groups={[
                    {
                        fields: [
                            {
                                type: 'row',
                                fields: [
                                    {
                                        type: 'text',
                                        name: 'startDate',
                                        label: 'Start date',
                                        value: '',
                                        placeholder: 'Date',
                                        onChange: vi.fn(),
                                    },
                                    {
                                        type: 'time',
                                        name: 'startTime',
                                        label: 'Start time',
                                        value: '',
                                        placeholder: 'Time',
                                        onChange: vi.fn(),
                                    },
                                ],
                            },
                        ],
                    },
                ]}
                onSubmit={vi.fn()}
            />
        );

        const startDate = screen.getByLabelText('Start date');
        const startTime = screen.getByLabelText('Start time');
        expect(startDate).toBeInTheDocument();
        expect(startTime).toBeInTheDocument();
        expect(startDate.closest('.grid')).toBe(startTime.closest('.grid'));
    });

    it('renders group children after fields and Form children after groups', () => {
        render(
            <Form
                ariaLabel="Test form"
                groups={[
                    {
                        legend: 'Tools',
                        fields: [textField('Name')],
                        children: <p>Group extra</p>,
                    },
                ]}
                onSubmit={vi.fn()}>
                <button type="submit">Create</button>
            </Form>
        );

        const fieldset = screen.getByRole('group', { name: 'Tools' });
        expect(within(fieldset).getByText('Group extra')).toBeInTheDocument();
        expect(within(fieldset).getByLabelText('Name')).toBeInTheDocument();

        const form = screen.getByRole('form', { name: 'Test form' });
        expect(within(form).getByRole('button', { name: 'Create' })).toBeInTheDocument();
        expect(within(fieldset).queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
    });

    it('shows a field error and marks the control invalid', () => {
        render(
            <Form
                ariaLabel="Test form"
                groups={[
                    {
                        fields: [
                            {
                                type: 'text',
                                name: 'email',
                                label: 'Email',
                                value: '',
                                placeholder: 'Email',
                                error: 'Email is required',
                                onChange: vi.fn(),
                            },
                        ],
                    },
                ]}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });

    it('calls onChange for a radio group and shows a radio error', async () => {
        class ResizeObserverMock {
            observe() {}
            unobserve() {}
            disconnect() {}
        }

        vi.stubGlobal('ResizeObserver', ResizeObserverMock);

        const onChange = vi.fn();
        render(
            <Form
                ariaLabel="Test form"
                groups={[
                    {
                        fields: [
                            {
                                type: 'radio',
                                name: 'status',
                                label: 'Status',
                                value: 'idle',
                                error: 'Pick a status',
                                items: [
                                    { value: 'idle', label: 'Active' },
                                    { value: 'paused', label: 'Paused' },
                                ],
                                onChange,
                            },
                        ],
                    },
                ]}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Pick a status');

        await userEvent.click(screen.getByRole('radio', { name: 'Paused' }));
        expect(onChange).toHaveBeenCalledWith('paused');

        vi.unstubAllGlobals();
    });

    it('disables a control when disabled is set on the field', () => {
        render(
            <Form
                ariaLabel="Test form"
                groups={[
                    {
                        fields: [
                            {
                                type: 'select',
                                name: 'scheduleType',
                                label: 'Type',
                                value: '',
                                placeholder: 'Pick',
                                disabled: true,
                                options: [{ value: 'once', label: 'Once' }],
                                onChange: vi.fn(),
                            },
                        ],
                    },
                ]}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByRole('combobox', { name: 'Type' })).toBeDisabled();
    });
});
