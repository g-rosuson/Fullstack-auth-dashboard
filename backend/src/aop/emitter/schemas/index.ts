import constants from 'shared/constants';

import type { EventType } from '../types';
import type { EventTypeToPayloadMap } from 'shared/types/jobs/events/types-jobs-events';
import type { ZodType } from 'zod';

import {
    aggregatedJobsEventSchema,
    jobCancelledEventSchema,
    jobFailedEventSchema,
    jobFinishedEventSchema,
    jobTargetFinishedEventSchema,
    runningJobsEventSchema,
    scheduledJobsEventSchema,
} from 'shared/schemas/jobs/events/schemas-events';

/**
 * A map of event schemas.
 */
const eventSchemas: { [T in EventType]: ZodType<EventTypeToPayloadMap[T]> } = {
    [constants.events.jobs.jobsAggregated]: aggregatedJobsEventSchema,
    [constants.events.jobs.jobTargetFinished]: jobTargetFinishedEventSchema,
    [constants.events.jobs.jobsRunning]: runningJobsEventSchema,
    [constants.events.jobs.jobsScheduled]: scheduledJobsEventSchema,
    [constants.events.jobs.jobFinished]: jobFinishedEventSchema,
    [constants.events.jobs.jobFailed]: jobFailedEventSchema,
    [constants.events.jobs.jobCancelled]: jobCancelledEventSchema,
};

export { eventSchemas };
