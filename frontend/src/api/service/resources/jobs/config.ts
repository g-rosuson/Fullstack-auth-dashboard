const domain = 'jobs/';

const config = {
    path: {
        stop: domain + 'stop/',
        run: domain + 'run/',
        create: domain + 'create',
        update: domain + 'update/',
        delete: domain + 'delete/',
        getById: domain + 'get/',
        getAll: domain + 'get-all',
        streamAll: domain + 'stream-all',
        changeScheduleStatus: domain + 'change-schedule-status/',
        retrySchedule: domain + 'retry-schedule/',
    },
};

export default config;
