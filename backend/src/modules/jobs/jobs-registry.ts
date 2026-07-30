import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import constants from 'shared/constants';

import {
    changeJobScheduleStatusPayloadSchema,
    createJobInputSchema,
    idRouteParamSchema,
    paginatedRouteParamSchema,
    runJobResultSchema,
    stopJobResultSchema,
    updateJobInputSchema,
} from './schemas';
import { deleteJobResultSchema } from 'shared/schemas/jobs';
import { jobSchema } from 'shared/schemas/jobs';
import { jobEventSchema } from 'shared/schemas/jobs/events/schemas-events';

const jobsRegistry = new OpenAPIRegistry();

jobsRegistry.registerPath({
    method: 'post',
    path: constants.routes.jobs.create,
    responses: {
        200: {
            description: 'Job created successfully',
            content: {
                'application/json': {
                    schema: jobSchema,
                },
            },
        },
    },
    request: {
        body: {
            description: 'Create job payload',
            content: {
                'application/json': {
                    schema: createJobInputSchema,
                },
            },
        },
    },
});

jobsRegistry.registerPath({
    method: 'delete',
    path: constants.routes.jobs.delete,
    responses: {
        200: {
            description: 'Job deleted successfully',
            content: {
                'application/json': {
                    schema: deleteJobResultSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'get',
    path: constants.routes.jobs.getAll,
    responses: {
        200: {
            description: 'All jobs',
            content: {
                'application/json': {
                    schema: jobSchema.array(),
                },
            },
        },
    },
    request: {
        params: paginatedRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'get',
    path: constants.routes.jobs.getById,
    responses: {
        200: {
            description: 'Job by id',
            content: {
                'application/json': {
                    schema: jobSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'put',
    path: constants.routes.jobs.update,
    responses: {
        200: {
            description: 'Job updated successfully',
            content: {
                'application/json': {
                    schema: jobSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
        body: {
            description: 'Update job payload',
            content: {
                'application/json': {
                    schema: updateJobInputSchema,
                },
            },
        },
    },
});

jobsRegistry.registerPath({
    method: 'put',
    path: constants.routes.jobs.changeScheduleStatus,
    responses: {
        200: {
            description: 'Schedule status changed successfully',
        },
    },
    request: {
        params: idRouteParamSchema,
        body: {
            description: 'Change schedule status payload',
            content: {
                'application/json': {
                    schema: changeJobScheduleStatusPayloadSchema,
                },
            },
        },
    },
});

jobsRegistry.registerPath({
    method: 'post',
    path: constants.routes.jobs.retrySchedule,
    responses: {
        200: {
            description: 'Schedule runtime attach retried for the saved job intent',
            content: {
                'application/json': {
                    schema: jobSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'post',
    path: constants.routes.jobs.stop,
    responses: {
        200: {
            description: 'Cancellation requested for the in-flight job run',
            content: {
                'application/json': {
                    schema: stopJobResultSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'post',
    path: constants.routes.jobs.run,
    responses: {
        200: {
            description: 'On-demand run requested for the job',
            content: {
                'application/json': {
                    schema: runJobResultSchema,
                },
            },
        },
    },
    request: {
        params: idRouteParamSchema,
    },
});

jobsRegistry.registerPath({
    method: 'get',
    path: constants.routes.jobs.streamAll,
    responses: {
        200: {
            description: 'Server-sent events stream of job execution updates',
            content: {
                'text/event-stream': {
                    schema: jobEventSchema,
                },
            },
        },
    },
});

export default jobsRegistry;
