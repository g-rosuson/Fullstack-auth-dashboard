import { z } from 'zod';

import constants from 'shared/constants';

import type {
    aggregatedJobsEventSchema,
    aggregatedRunningJobSchema,
    jobCancelledEventSchema,
    jobFailedEventSchema,
    jobFinishedEventSchema,
    jobTargetFinishedEventSchema,
    runningJobsEventSchema,
    scheduledJobEventSchema,
    scheduledJobsEventSchema,
} from 'shared/schemas/jobs/events/schemas-events';

/**
 * A scheduled job type.
 */
type ScheduledJobEvent = z.infer<typeof scheduledJobEventSchema>;

/**
 * A job target finished event type.
 */
type JobTargetFinishedEvent = z.infer<typeof jobTargetFinishedEventSchema>;

/**
 * A running job type.
 */
type AggregatedRunningJob = z.infer<typeof aggregatedRunningJobSchema>;

/**
 * Maps event-types to their corresponding event payload.
 */
type EventTypeToPayloadMap = {
    [constants.events.jobs.jobsAggregated]: z.infer<typeof aggregatedJobsEventSchema>;
    [constants.events.jobs.jobFinished]: z.infer<typeof jobFinishedEventSchema>;
    [constants.events.jobs.jobTargetFinished]: JobTargetFinishedEvent;
    [constants.events.jobs.jobsRunning]: z.infer<typeof runningJobsEventSchema>;
    [constants.events.jobs.jobsScheduled]: z.infer<typeof scheduledJobsEventSchema>;
    [constants.events.jobs.jobFailed]: z.infer<typeof jobFailedEventSchema>;
    [constants.events.jobs.jobCancelled]: z.infer<typeof jobCancelledEventSchema>;
};

export type { EventTypeToPayloadMap, ScheduledJobEvent, AggregatedRunningJob, JobTargetFinishedEvent };
