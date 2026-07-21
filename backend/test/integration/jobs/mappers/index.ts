import type { CreateJobInput, UpdateJobInput } from 'modules/jobs/types';

import { INTEGRATION_JOB_START_DELAY_MS } from '../constants';
import constants from 'shared/constants';

import type { JobSchedule } from 'shared/types/jobs';

/**
 * Builds a job with a schedule payload.
 */
const mapToJobWithSchedulePayload = (
    name: string,
    scheduleOverrides: Partial<NonNullable<CreateJobInput['schedule']>> = {}
): CreateJobInput => ({
    name,
    schedule: {
        status: constants.status.schedule.idle,
        type: 'daily',
        startDate: new Date(Date.now() + INTEGRATION_JOB_START_DELAY_MS).toISOString(),
        endDate: null,
        ...scheduleOverrides,
    },
    tools: [
        {
            type: 'scraper',
            keywords: ['typescript'],
            maxPages: 1,
            targets: [
                {
                    target: 'jobs-ch',
                    keywords: ['remote'],
                    maxPages: 1,
                },
            ],
        },
    ],
});

/**
 * Builds a job without a schedule payload.
 */
const mapToJobWithoutSchedulePayload = (name: string): CreateJobInput => ({
    name,
    schedule: null,
    tools: [
        {
            type: 'scraper',
            keywords: ['integration'],
            maxPages: 1,
            targets: [{ target: 'jobs-ch' }],
        },
    ],
});

/**
 * Builds a job URL from a route template and id.
 */
function mapToJobUrl(routeTemplate: string, id: string): string {
    return routeTemplate.replace(':id', id);
}

/**
 * Builds the PUT body from a GET/create job shape. When `partial.schedule` is omitted,
 * copies persisted schedule fields (`type`, `startDate`, `endDate`, `status`).
 */
function mapToUpdateJobPayload(
    job: { name: string; schedule: JobSchedule | null; tools: UpdateJobInput['tools'] },
    partial: Partial<UpdateJobInput> = {}
): UpdateJobInput {
    let schedule: UpdateJobInput['schedule'];

    if (partial.schedule !== undefined) {
        schedule = partial.schedule;
    } else if (job.schedule == null) {
        schedule = null;
    } else {
        schedule = {
            type: job.schedule.type,
            startDate: job.schedule.startDate,
            endDate: job.schedule.endDate,
            status: job.schedule.status,
        };
    }

    return {
        name: partial.name ?? job.name,
        schedule,
        tools: partial.tools ?? job.tools,
        status: partial.status ?? schedule?.status ?? constants.status.schedule.idle,
    };
}

export { mapToJobWithSchedulePayload, mapToJobWithoutSchedulePayload, mapToJobUrl, mapToUpdateJobPayload };
