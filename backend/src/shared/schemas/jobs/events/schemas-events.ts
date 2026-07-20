import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import constants from 'shared/constants';

import { executionScheduleSchema, executionToolTargetSchema } from '../tools/execution/schemas-execution';
import { jobScheduleStatusSchema } from 'shared/schemas/jobs';
import { toolSchema } from 'shared/schemas/jobs/tools/schemas-tools';

extendZodWithOpenApi(z);

/**
 * A job target finished event type schema.
 */
const jobTargetFinishedEventTypeSchema = z.literal(constants.events.jobs.jobTargetFinished);

/**
 * A running jobs event type schema.
 */
const runningJobsEventTypeSchema = z.literal(constants.events.jobs.jobsRunning);

/**
 * A scheduled jobs event type schema — job IDs currently attached in the scheduler runtime.
 */
const scheduledJobsEventTypeSchema = z.literal(constants.events.jobs.jobsScheduled);

/**
 * A job finished event type schema.
 */
const jobFinishedEventTypeSchema = z.literal(constants.events.jobs.jobFinished);

/**
 * A job failed event type schema.
 */
const jobFailedEventTypeSchema = z.literal(constants.events.jobs.jobFailed);

/**
 * A job cancelled event type schema.
 */
const jobCancelledEventTypeSchema = z.literal(constants.events.jobs.jobCancelled);

/**
 * A jobs aggregated event type schema.
 */
const jobsAggregatedEventTypeSchema = z.literal(constants.events.jobs.jobsAggregated);

/**
 * A job target finished event schema.
 */
const jobTargetFinishedEventSchema = z
    .object({
        jobId: z.string(),
        userId: z.string(),
        executionId: z.string(),
        tool: toolSchema,
        target: executionToolTargetSchema,
        type: jobTargetFinishedEventTypeSchema,
        schedule: executionScheduleSchema,
    })
    .openapi('JobTargetFinishedEvent');

/**
 * A running jobs event schema.
 */
const runningJobsEventSchema = z
    .object({
        runningJobs: z.array(z.string()),
        userId: z.string().optional(),
        type: runningJobsEventTypeSchema,
    })
    .openapi('RunningJobsEvent');

/**
 * A scheduled job schema.
 */
const scheduledJobEventSchema = z
    .object({
        jobId: z.string(),
        status: jobScheduleStatusSchema,
    })
    .openapi('ScheduledJobEvent');

/**
 * A running job schema.
 */
const aggregatedRunningJobSchema = z
    .object({
        jobId: z.string(),
        finishedEvents: z.array(jobTargetFinishedEventSchema),
    })
    .openapi('AggregatedRunningJob');

/**
 * A jobs aggregated event schema.
 */
const aggregatedJobsEventSchema = z
    .object({
        userId: z.string(),
        type: jobsAggregatedEventTypeSchema,
        runningJobs: z.array(aggregatedRunningJobSchema),
        scheduledJobs: z.array(scheduledJobEventSchema),
    })
    .openapi('AggregatedJobsEvent');

/**
 * A scheduled jobs event schema.
 */
const scheduledJobsEventSchema = z
    .object({
        scheduledJobs: z.array(scheduledJobEventSchema),
        userId: z.string(),
        type: scheduledJobsEventTypeSchema,
    })
    .openapi('ScheduledJobsEvent');

/**
 * A job finished event schema.
 */
const jobFinishedEventSchema = z
    .object({
        jobId: z.string(),
        userId: z.string(),
        type: jobFinishedEventTypeSchema,
        finishedAt: z.string().datetime({ offset: true }),
        executionId: z.string(),
        lastRun: z.string().datetime({ offset: true }).nullable(),
        nextRun: z.string().datetime({ offset: true }).nullable(),
    })
    .openapi('JobFinishedEvent');

/**
 * A job failed event schema.
 */
const jobFailedEventSchema = z
    .object({
        jobId: z.string(),
        userId: z.string(),
        executionId: z.string(),
        type: jobFailedEventTypeSchema,
        failedAt: z.string().datetime({ offset: true }),
    })
    .openapi('JobFailedEvent');

/**
 * A job cancelled event schema.
 */
const jobCancelledEventSchema = z
    .object({
        jobId: z.string(),
        userId: z.string(),
        type: jobCancelledEventTypeSchema,
        cancelledAt: z.string().datetime({ offset: true }),
        executionId: z.string(),
        lastRun: z.string().datetime({ offset: true }).nullable(),
        nextRun: z.string().datetime({ offset: true }).nullable(),
    })
    .openapi('JobCancelledEvent');

/**
 * A job event schema.
 */
const jobEventSchema = z
    .discriminatedUnion('type', [
        jobTargetFinishedEventSchema,
        runningJobsEventSchema,
        scheduledJobsEventSchema,
        jobFinishedEventSchema,
        jobFailedEventSchema,
        jobCancelledEventSchema,
    ])
    .openapi('JobEvent');

export {
    aggregatedJobsEventSchema,
    aggregatedRunningJobSchema,
    jobTargetFinishedEventSchema,
    runningJobsEventSchema,
    scheduledJobsEventSchema,
    scheduledJobEventSchema,
    jobFinishedEventSchema,
    jobEventSchema,
    jobFailedEventSchema,
    jobCancelledEventSchema,
};
