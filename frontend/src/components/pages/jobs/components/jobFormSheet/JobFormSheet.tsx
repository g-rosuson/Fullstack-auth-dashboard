import React, { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';

import ToolDialog from './toolDialog/ToolDialog';
import DropdownMenu from '@/components/blocks/dropdownMenu/DropdownMenu';
import Flex from '@/components/blocks/flex/Flex';
import Form from '@/components/blocks/form/Form';
import Sheet from '@/components/blocks/sheet/Sheet';

import mappers from './mappers';

import type { JobFormSheetProps, JobFormSheetState, JobFormSheetTool } from './types/JobSheet.types';
import type { FormField, FormGroup, FormOption } from '@/components/blocks/form/Form.types';

import jobFormSheetConstants from './constants';
import { JobScheduleStatus, JobScheduleType } from '@/_types/_gen';
import jobConstants from '@/components/pages/jobs/constants';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item';
import utils from '@/utils';

const JobFormSheet = ({ job, isOpen, isSubmitting, onOpenChange, onCreateJob, onUpdateJob }: JobFormSheetProps) => {
    // State
    const [state, setState] = useState<JobFormSheetState>({
        name: '',
        scheduleType: '',
        scheduleStatus: 'idle',
        startDate: undefined,
        startTime: '',
        endDate: undefined,
        endTime: '',
        tools: [],
        toolToEdit: null,
        isEditing: !!job,
        isToolDialogOpen: false,
    });

    /**
     * Toggles the adding tool dialog.
     */
    const toggleToolDialog = (toolToEdit: JobFormSheetTool | null = null) => {
        setState(prev => ({ ...prev, isToolDialogOpen: !prev.isToolDialogOpen, toolToEdit }));
    };

    /**
     * Handles the change event for the given field.
     */
    const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /**
     * Handles the change event for the schedule type select.
     */
    const onScheduleTypeChange = (option: FormOption | undefined) => {
        const hasScheduleType = !!option?.value;
        const isOnceSchedule = option?.value === JobScheduleType.once;

        setState(prev => ({
            ...prev,
            scheduleType: option?.value || '',
            ...((!hasScheduleType || isOnceSchedule) && {
                endDate: undefined,
                endTime: '',
            }),
            ...(!hasScheduleType && {
                startDate: undefined,
                startTime: '',
            }),
        }));
    };

    /**
     * Adds the given tool to the list of added tools and closes the dialog.
     */
    const onToolAdd = (tool: JobFormSheetTool) => {
        setState(prev => ({
            ...prev,
            isToolDialogOpen: false,
            tools: [...prev.tools, tool],
        }));
    };

    /**
     * Edits the given tool in the list of added tools.
     */
    const onToolEdit = (tool: JobFormSheetTool) => {
        setState(prev => ({
            ...prev,
            tools: prev.tools.map(t => (t.toolId === tool.toolId ? tool : t)),
            isToolDialogOpen: false,
        }));
    };

    /**
     * Removes the given tool from the list of added tools.
     */
    const onToolRemove = (index: number) => {
        setState(prev => ({
            ...prev,
            tools: prev.tools.filter((_, i) => i !== index),
        }));
    };

    /**
     * Handles the change event for the given date field.
     * @param name - The name of the date field to update.
     * @param date - The date value to update the field with.
     */
    const onDateChange = (name: 'startDate' | 'endDate', date: Date | null) => {
        setState(prev => ({ ...prev, [name]: date ? date : undefined }));
    };

    /**
     * Handles the change event for the schedule status radio group.
     */
    const onScheduleStatusChange = (value: string) => {
        setState(prev => ({ ...prev, scheduleStatus: value as JobScheduleStatus }));
    };

    /**
     * Handles the submit event for the form.
     */
    const onFormSubmit = async () => {
        try {
            if (state.isEditing) {
                await onUpdateJob(mappers.mapToUpdateJobPayload(state));
            } else {
                await onCreateJob(mappers.mapToCreateJobPayload(state));
            }
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Returns the tool item options for the given tool.
     */
    const getToolItemOptions = (index: number, tool: JobFormSheetTool) => [
        {
            label: jobFormSheetConstants.label.field.tool.edit,
            onClick: () => toggleToolDialog(tool),
        },
        {
            label: jobFormSheetConstants.label.field.tool.delete,
            variant: 'destructive' as const,
            onClick: () => onToolRemove(index),
        },
    ];

    /**
     * Populates the form fields from the job prop when the sheet opens.
     */
    useEffect(() => {
        if (isOpen) {
            setState(prev => {
                const startDate = job?.schedule?.startDate;
                const endDate = job?.schedule?.endDate;
                const startTime = utils.time.getTimeFromDate(job?.schedule?.startDate || '') || '';
                const endTime = utils.time.getTimeFromDate(job?.schedule?.endDate || '') || '';
                return {
                    ...prev,
                    name: job?.name || '',
                    tools: mappers.mapToJobFormTools(job?.tools || []),
                    scheduleType: job?.schedule?.type || '',
                    scheduleStatus: job?.schedule?.status || JobScheduleStatus.idle,
                    startDate: startDate ? new Date(startDate) : undefined,
                    startTime,
                    endDate: endDate ? new Date(endDate) : undefined,
                    endTime,
                    isEditing: !!job,
                };
            });
        }
    }, [isOpen, job]);

    // Determine the schedule type options
    const scheduleTypeOptions = Object.values(JobScheduleType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
    }));

    // Determine the schedule status options
    const scheduleStatusOptions = Object.values(JobScheduleStatus).map(status => {
        const isIdle = status === JobScheduleStatus.idle;
        const label = isIdle ? jobConstants.label.status.active : jobConstants.label.status.paused;
        return {
            value: status,
            label,
        };
    });

    // Determine title
    const title = state.isEditing ? jobFormSheetConstants.label.title.edit : jobFormSheetConstants.label.title.create;
    const submitLabel = state.isEditing
        ? jobFormSheetConstants.label.button.edit.label
        : jobFormSheetConstants.label.button.create.label;

    const hasScheduleType = !!state.scheduleType;
    const isOnceSchedule = state.scheduleType === JobScheduleType.once;

    const scheduleFields: FormField[] = [
        {
            type: 'select',
            name: 'scheduleType',
            label: jobFormSheetConstants.label.field.scheduleType.label,
            options: scheduleTypeOptions,
            value: state.scheduleType,
            placeholder: jobFormSheetConstants.label.field.scheduleType.placeholder,
            onChange: onScheduleTypeChange,
        },
        {
            type: 'row',
            fields: [
                {
                    type: 'date',
                    name: 'startDate',
                    label: jobFormSheetConstants.label.field.startDate.label,
                    placeholder: jobFormSheetConstants.label.field.startDate.placeholder,
                    value: state.startDate,
                    onChange: value => onDateChange('startDate', value),
                    disabled: !hasScheduleType,
                    required: hasScheduleType,
                },
                {
                    type: 'time',
                    name: 'startTime',
                    label: jobFormSheetConstants.label.field.startTime.label,
                    placeholder: jobFormSheetConstants.label.field.startTime.placeholder,
                    value: state.startTime,
                    onChange: onFieldChange,
                    disabled: !hasScheduleType,
                    required: hasScheduleType,
                },
            ],
        },
    ];

    if (!isOnceSchedule) {
        scheduleFields.push({
            type: 'row',
            fields: [
                {
                    type: 'date',
                    name: 'endDate',
                    label: jobFormSheetConstants.label.field.endDate.label,
                    placeholder: jobFormSheetConstants.label.field.endDate.placeholder,
                    value: state.endDate,
                    onChange: value => onDateChange('endDate', value),
                    disabled: !hasScheduleType,
                },
                {
                    type: 'time',
                    name: 'endTime',
                    label: jobFormSheetConstants.label.field.endTime.label,
                    placeholder: jobFormSheetConstants.label.field.endTime.placeholder,
                    value: state.endTime,
                    onChange: onFieldChange,
                    disabled: !hasScheduleType,
                },
            ],
        });
    }

    scheduleFields.push({
        type: 'radio',
        name: 'scheduleStatus',
        label: jobFormSheetConstants.label.title.status,
        items: scheduleStatusOptions,
        value: state.scheduleStatus,
        disabled: !hasScheduleType,
        onChange: onScheduleStatusChange,
    });

    const groups: FormGroup[] = [
        {
            fields: [
                {
                    type: 'text',
                    name: 'name',
                    label: jobFormSheetConstants.label.field.name.label,
                    placeholder: jobFormSheetConstants.label.field.name.placeholder,
                    value: state.name,
                    onChange: onFieldChange,
                    required: true,
                },
            ],
        },
        {
            legend: jobFormSheetConstants.label.title.tools,
            children: (
                <Flex direction="column" gap="md">
                    <Button
                        type="button"
                        size="xs"
                        aria-label={jobFormSheetConstants.label.button.target.add.ariaLabel}
                        onClick={() => toggleToolDialog()}
                        className="w-fit">
                        <PlusIcon />
                        {jobFormSheetConstants.label.button.target.add.label}
                    </Button>

                    {state.tools.map((tool, index) => (
                        <Item key={index} variant="outline" className="bg-muted">
                            <ItemContent>
                                <ItemTitle>{tool.type}</ItemTitle>
                            </ItemContent>

                            <ItemActions>
                                <DropdownMenu items={getToolItemOptions(index, tool)} />
                            </ItemActions>
                        </Item>
                    ))}
                </Flex>
            ),
        },
        {
            legend: jobFormSheetConstants.label.title.schedule,
            fields: scheduleFields,
        },
    ];

    // Determine the form id
    const formId = 'job-sheet-form';

    return (
        <Sheet
            title={title}
            open={isOpen}
            primaryButtonLabel={submitLabel}
            isSubmitting={isSubmitting}
            onOpenChange={onOpenChange}
            formId={formId}>
            <Form id={formId} ariaLabel={title} groups={groups} onSubmit={onFormSubmit} />

            <ToolDialog
                isOpen={state.isToolDialogOpen}
                onOpenChange={() => toggleToolDialog()}
                toolToEdit={state.toolToEdit}
                onToolAdd={onToolAdd}
                onToolEdit={onToolEdit}
            />
        </Sheet>
    );
};

export default JobFormSheet;
