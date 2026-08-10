const constants = {
    label: {
        title: {
            schedule: 'Schedule',
            executions: 'Executions',
            noExecutions: 'No executions found',
            identifier: 'Identifier',
            keywords: 'Keywords',
            maxPages: 'Max pages',
            total: 'Total',
            passed: 'Passed',
            rejected: 'Rejected',
            reasonCodes: 'Reason codes',
            results: 'Results ',
            targets: 'Targets ',
            delegatedAt: 'Delegated at',
            finishedAt: 'Finished at',
            cancelledAt: 'Cancelled at',
            tools: 'Tools ',
        },

        section: {
            execution: {
                table: {
                    header: {
                        passed: 'Passed',
                        title: 'Title',
                        url: 'URL',
                    },

                    indicator: {
                        reasonCodes: 'Reason codes',
                    },

                    columns: {
                        passed: 'Passed',
                        title: 'Title',
                        url: 'URL',
                    },
                },
            },
        },

        placeholder: {
            executions: {
                title: 'No executions found',
                description: 'Execution information will appear here as job targets finish running',
            },
        },

        ariaDescribedby:
            'An overlay to provide additional information about the job details, like schedule and execution information.',
    },

    key: {
        section: {
            execution: {
                table: {
                    header: {
                        passed: 'passed',
                        title: 'title',
                        url: 'url',
                    },
                },
            },
        },
    },
} as const;

export default constants;
