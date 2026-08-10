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
    },
} as const;

export default constants;
