const basePath = '/api';

const authDomain = '/auth';
const jobsDomain = '/jobs';
const docsDomain = '/docs';

const routes = {
    docs: {
        openapi: basePath + docsDomain + '/openapi',
    },
    auth: {
        register: basePath + authDomain + '/register',
        login: basePath + authDomain + '/login',
        logout: basePath + authDomain + '/logout',
        refresh: basePath + authDomain + '/refresh',
    },
    jobs: {
        create: basePath + jobsDomain + '/create',
        changeScheduleStatus: basePath + jobsDomain + '/change-schedule-status/:id',
        retrySchedule: basePath + jobsDomain + '/retry-schedule/:id',
        stop: basePath + jobsDomain + '/stop/:id',
        update: basePath + jobsDomain + '/update/:id',
        delete: basePath + jobsDomain + '/delete/:id',
        getById: basePath + jobsDomain + '/get/:id',
        getAll: basePath + jobsDomain + '/get-all',
        streamAll: basePath + jobsDomain + '/stream-all',
    },
};

export default routes;
