const actionKey = {
    crud: {
        edit: 'edit',
        delete: 'delete',
        create: 'create',
    },

    execution: {
        run: 'run',
        stop: 'stop',
    },

    schedule: {
        pause: 'pause',
        activate: 'activate',
        retry: 'retry',
    },
} as const;

const confirmationKey = {
    delete: actionKey.crud.delete,
    ...actionKey.execution,
    ...actionKey.schedule,
} as const;

const constants = {
    label: {
        empty: 'n/a',

        action: {
            crud: {
                open: 'Open',
                edit: 'Edit',
                delete: 'Delete',
                create: 'Create',
            },

            execution: {
                run: 'Run',
                stop: 'Stop',
            } as const satisfies Record<keyof typeof actionKey.execution, string>,

            schedule: {
                pause: 'Pause',
                activate: 'Activate',
                retry: 'Reschedule',
            } as const satisfies Record<keyof typeof actionKey.schedule, string>,
        },

        confirmation: {
            delete: {
                title: 'Delete job',
                description: 'Are you sure you want to delete the job?',
                variant: 'destructive',
            },
            stop: {
                title: 'Stop job',
                description: 'Are you sure you want to stop the job?',
                variant: 'destructive',
            },
            pause: {
                title: 'Pause job',
                description: 'Are you sure you want to pause the job?',
                variant: 'default',
            },
            activate: {
                title: 'Activate job',
                description: 'Are you sure you want to activate the job?',
                variant: 'default',
            },
            run: {
                title: 'Run job',
                description: 'Are you sure you want to run the job?',
                variant: 'default',
            },
            retry: {
                title: 'Reschedule job',
                description: 'Are you sure you want to retry scheduling this job?',
                variant: 'default',
            },
        } as const satisfies Record<
            keyof typeof confirmationKey,
            { title: string; description: string; variant: 'destructive' | 'default' }
        >,
    },

    key: {
        action: actionKey,
        confirmation: confirmationKey,
    },

    layout: {
        gap: 'md',
        minItemWidth: 'medium',
        skeletonCount: 6,
    },
} as const;

export default constants;
