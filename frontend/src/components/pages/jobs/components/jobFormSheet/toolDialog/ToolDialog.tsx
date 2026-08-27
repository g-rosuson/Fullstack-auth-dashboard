import React, { useEffect, useState } from 'react';

import ScraperTool from './components/scraperTool/ScraperTool';
import { ToolDialogProps, ToolType } from './types/ToolDialog.types';
import Dialog from '@/components/blocks/dialog/Dialog';
import Select from '@/components/blocks/select/Select';

import type { JobFormSheetTool } from '../types/JobSheet.types';

import constants from '@/components/pages/jobs/components/jobFormSheet/constants';

const initialScraperTool = {
    keyword: '',
    keywords: [],
    maxPages: 0,
    targets: [],
    type: 'scraper' as const,
    toolId: undefined,
};

const initialEmailTool = {
    subject: '',
    body: '',
    targets: [],
    type: 'email' as const,
    toolId: undefined,
};

const ToolDialog = ({ isOpen, toolToEdit, onOpenChange, onToolAdd, onToolEdit }: ToolDialogProps) => {
    // State
    const [tool, setTool] = useState<JobFormSheetTool | null>(null);

    /**
     * Handles the change event for the tool type select.
     */
    const onToolTypeChange = (option: { value: ToolType; label: string } | undefined) => {
        setTool(() => {
            if (option?.value === 'scraper') {
                return initialScraperTool;
            }

            if (option?.value === 'email') {
                return initialEmailTool;
            }

            return null;
        });
    };

    /**
     * Handles the change event for the tool.
     */
    const onToolChange = (tool: JobFormSheetTool) => {
        setTool(tool);
    };

    /**
     * Handles the submit event for the add tool form.
     */
    const onAddToolSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (toolToEdit && tool) {
            onToolEdit(tool);
        } else if (!toolToEdit && tool) {
            onToolAdd(tool);
        }
    };

    /**
     * Populates the tool state with the tool to edit when the dialog opens.
     */
    useEffect(() => {
        if (isOpen && toolToEdit) {
            setTool(toolToEdit);
        }

        return () => {
            setTool(null);
        };
    }, [toolToEdit, isOpen]);

    // Determine the tool types
    const toolOptions = [
        {
            value: constants.label.field.toolType.option.scraper.value,
            label: constants.label.field.toolType.option.scraper.label,
        },
        {
            value: constants.label.field.toolType.option.email.value,
            label: constants.label.field.toolType.option.email.label,
        },
    ];

    // Determine tool component
    let toolComponent: React.ReactNode = null;

    if (tool?.type === 'scraper') {
        toolComponent = <ScraperTool tool={tool} onChange={onToolChange} />;
    }

    // Determine if the submit button should be disabled
    const isSubmitButtonDisabled = !tool || !tool?.targets?.length;

    const formId = 'add-tool-form';

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onOpenChange}
            title={constants.label.title.addTool}
            description={constants.label.description.addTool}
            formId={formId}
            primaryButtonLabel={constants.label.button.tool.add.label}
            primaryButtonDisabled={isSubmitButtonDisabled}
            className="max-h-[90vh] overflow-y-scroll">
            <form id={formId} onSubmit={onAddToolSubmit} className="flex flex-col gap-md">
                <Select
                    className="w-full"
                    label={constants.label.field.toolType.label}
                    options={toolOptions}
                    name="toolType"
                    value={tool?.type || ''}
                    placeholder={constants.label.field.toolType.placeholder}
                    onChange={onToolTypeChange}
                />

                {toolComponent}
            </form>
        </Dialog>
    );
};

export default ToolDialog;
