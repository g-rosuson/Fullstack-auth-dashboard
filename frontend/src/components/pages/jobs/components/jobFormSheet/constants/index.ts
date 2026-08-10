const constants = {
    label: {
        title: {
            edit: 'Edit job',
            create: 'Create job',
            tools: 'Tools',
            schedule: 'Schedule',
            status: 'Status',
            targets: 'Scraper targets',
            addTool: 'Add tool',
        },

        description: {
            targets: 'Add scraper targets and define their settings.',
            addTool: 'Add a tool and its targets for your job.',
        },

        field: {
            name: {
                label: 'Name',
                placeholder: 'Enter the job name...',
            },
            tool: {
                edit: 'Edit',
                delete: 'Delete',
            },
            scheduleType: {
                label: 'Type',
                placeholder: 'Select a schedule type...',
            },
            startDate: {
                label: 'Start date',
                placeholder: 'Select a start date...',
            },
            startTime: {
                label: 'Start time',
                placeholder: 'Select a start time...',
            },
            endDate: {
                label: 'End date',
                placeholder: 'Select an end date...',
            },
            endTime: {
                label: 'End time',
                placeholder: 'Select an end time...',
            },
            maxPages: {
                label: 'Max pages',
                placeholder: 'Enter max pages...',
            },
            keywords: {
                label: 'Keywords',
                placeholder: 'Enter a keyword...',
                asterisk: '*',
                error: 'Add at least one global keyword or a keyword for each target',
            },
            target: {
                label: 'Target',
                placeholder: 'Select a target...',
            },
            toolType: {
                label: 'Tool type',
                placeholder: 'Select a tool type...',
                option: {
                    scraper: {
                        label: 'Scraper',
                        value: 'scraper',
                    },
                    email: {
                        label: 'Email',
                        value: 'email',
                    },
                },
            },
        },

        button: {
            target: {
                add: {
                    label: 'Add target',
                    ariaLabel: 'Add target',
                },
                remove: {
                    ariaLabel: 'Remove target',
                },
            },

            tool: {
                add: {
                    label: 'Add tool',
                    ariaLabel: 'Add tool',
                },
            },

            edit: {
                label: 'Edit',
            },

            create: {
                label: 'Create',
            },
        },
    },
} as const;

export default constants;
