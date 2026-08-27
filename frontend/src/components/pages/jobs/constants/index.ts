const statusKey = {
    running: 'running',
    active: 'active',
    paused: 'paused',
    inactive: 'inactive',
    missing: 'missing',
} as const;

const constants = {
    key: {
        status: statusKey,
    },

    label: {
        status: {
            running: 'Running',
            active: 'Active',
            paused: 'Paused',
            inactive: 'Inactive',
            missing: 'Missing',
        } as const satisfies Record<keyof typeof statusKey, string>,
        toast: {
            jobFailed: 'Job failed',
            jobCancelled: 'Job cancelled',
            jobFinished: 'Job finished',
            targetFinished: 'Target finished',
            created: 'Job created',
            updated: 'Job updated',
            deleted: 'Job deleted',
            run: 'Job started',
            stop: 'Stop requested',
            pause: 'Schedule paused',
            activate: 'Schedule activated',
            retry: 'Schedule retry requested',
            mutationFailed: 'Request failed',
            fallback: 'n/a',
        } as const,
    },
} as const;

export default constants;
