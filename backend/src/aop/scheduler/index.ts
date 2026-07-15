import cron from 'node-cron';

import { Delegator } from 'aop/delegator';
import { Emitter } from 'aop/emitter';
import { InternalException } from 'aop/exceptions';
import { logger } from 'aop/logging';

import constants from 'shared/constants';

import {
    CronJob,
    FormatCronExpressionPayload,
    NextAndPreviousRunPayload,
    NextRunFromPersistedSchedulePayload,
    SchedulePayload,
} from './types';

import parser from 'cron-parser';
import { cronJobTypeSchema } from 'shared/schemas/cron';
import { jobScheduleIdleStatusSchema, jobScheduleStoppedStatusSchema } from 'shared/schemas/jobs';

/**
 * Singleton scheduler service that manages cron jobs using node-cron.
 * Provides a API for cron job lifecycle management.
 */
export class Scheduler {
    private static instance: Scheduler;
    private cronJobs: Map<string, CronJob> = new Map();

    private constructor() {}

    /**
     * Returns the singleton instance of the Scheduler.
     * Creates a new instance if one doesn't exist.
     */
    static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler();
        }

        return Scheduler.instance;
    }

    /**
     * Returns the next calendar instant that matches `cronExpression`, using the same
     * `cron-parser` window as {@link schedule} / {@link getNextAndPreviousRun}.
     *
     * `cron-parser` requires `next()` to be strictly after `currentDate`. When `now` is
     * before `anchorStartDate`, `currentDate` is set to one millisecond before the anchor
     * (clamped to epoch) so the first match can be exactly `anchorStartDate`.
     *
     * @param params - Parsed recurring rule and bounds
     * @param params.cronExpression - Five-field cron string (aligned with `node-cron`)
     * @param params.anchorStartDate - Original schedule start; defines the “not yet started” branch above
     * @param params.endDate - If set, passed to `cron-parser` as `endDate` (no match after this)
     * @param params.logContextJobId - If provided, logs parse/`next()` failures for that job id
     * @returns Next run as `Date`, or `null` when there is no valid next occurrence or an error occurs
     */
    private getNextRunDate(params: {
        cronExpression: string;
        anchorStartDate: Date;
        endDate: Date | null;
        logContextJobId?: string;
    }): Date | null {
        const { cronExpression, anchorStartDate, endDate, logContextJobId } = params;

        try {
            const now = new Date();

            /**
             * cron-parser's `next()` is strictly greater than `currentDate`.
             * If we pass `startDate` exactly for not-yet-started jobs, the first
             * computed run skips to the next interval (e.g. next day for daily).
             * Use one millisecond before startDate so the first `next()` can be
             * the startDate itself. Clamp to epoch to avoid negative timestamps.
             */
            const nextCurrentDate = now < anchorStartDate ? new Date(Math.max(0, anchorStartDate.getTime() - 1)) : now;

            const nextInterval = parser.parse(cronExpression, {
                currentDate: nextCurrentDate,
                endDate: endDate ?? undefined,
            });

            return nextInterval.next().toDate();
        } catch (error) {
            if (logContextJobId !== undefined) {
                logger.error(`Error computing next run for job "${logContextJobId}":`, { error: error as Error });
            }

            return null;
        }
    }

    /**
     * Next run for a persisted recurring schedule when no CronJob exists in memory yet (e.g. server restart).
     */
    public getNextRunFromPersistedSchedule(payload: NextRunFromPersistedSchedulePayload): Date | null {
        const startDate = new Date(payload.startDate);
        const endDate = payload.endDate ? new Date(payload.endDate) : null;

        const cronExpression = this.formatCronExpression({ startDate, type: payload.type });
        if (!cronExpression) {
            return null;
        }

        if (!cron.validate(cronExpression)) {
            return null;
        }

        return this.getNextRunDate({
            cronExpression,
            anchorStartDate: startDate,
            endDate,
        });
    }

    /**
     * Gets the next and previous run dates for a cron job.
     * @param jobId - The id of the cron job to get the next and previous run for
     * @returns The next and previous run dates for the cron job
     */
    public getNextAndPreviousRun(jobId: string): NextAndPreviousRunPayload {
        try {
            const cronJob = this.cronJobs.get(jobId);
            const now = new Date();
            let nextRun: Date | null = null;
            let previousRun: Date | null = null;

            if (!cronJob) {
                return { nextRun, previousRun };
            }

            if (!cronJob.cronExpression) {
                return { nextRun, previousRun };
            }

            // Next run first so `parser.parse` call order matches `prev` below (tests rely on two parses).
            nextRun = this.getNextRunDate({
                cronExpression: cronJob.cronExpression,
                anchorStartDate: cronJob.startDate,
                endDate: cronJob.endDate,
                logContextJobId: jobId,
            });

            const prevInterval = parser.parse(cronJob.cronExpression, {
                currentDate: now,
                startDate: cronJob.startDate,
            });

            // Calling prev() can throw if there is no previous occurrence within the defined start/end range,
            // or if the cron expression is invalid.
            try {
                previousRun = prevInterval.prev().toDate();
            } catch (error) {
                // Note: Errors are expected here the first time a job with a schedule is processed,
                // therefore we skip logging an error to not pollute the logs.
            }

            return { nextRun, previousRun };
        } catch (error) {
            logger.error(`Error computing next/previous run for job "${jobId}":`, { error: error as Error });
            return { nextRun: null, previousRun: null };
        }
    }

    /**
     * Formats a cron expression based on the job's type and schedule.
     * Supports daily, weekly, monthly, and yearly recurrence patterns.
     *
     * @param payload - The cron job payload containing schedule information
     * @returns A cron expression string in the format: "minute hour day-of-month month day-of-week"
     */
    private formatCronExpression({ startDate, type }: FormatCronExpressionPayload) {
        const minute = startDate.getMinutes();
        const hour = startDate.getHours();
        const monthDay = startDate.getDate();
        const month = startDate.getMonth() + 1;
        const weekday = startDate.getDay();

        // Cron format: minute hour day-of-month month day-of-week
        switch (type) {
            case 'daily':
                // Run every day at specified time
                return `${minute} ${hour} * * *`;

            case 'weekly':
                // Run every week on the day specified in startDate at specified time
                return `${minute} ${hour} * * ${weekday}`;

            case 'monthly':
                // Run every month on the day specified in startDate at specified time
                return `${minute} ${hour} ${monthDay} * *`;

            case 'yearly':
                // Run every year on the date specified in startDate at specified time
                // Note: weekday is '*' because we want the specific calendar date, not a weekday-based rule
                return `${minute} ${hour} ${monthDay} ${month} *`;
        }
    }

    /**
     * Emits all cron jobs for a user.
     * @param userId - The user id to emit the cron jobs for
     */
    private emitAllCronJobs(userId: string): void {
        const emitter = Emitter.getInstance();

        emitter.emit({
            scheduledJobs: this.getAllJobs().map(job => ({
                jobId: job.jobId,
                status: job.status,
            })),
            userId: userId,
            type: constants.events.jobs.scheduledJobs,
        });
    }

    /**
     * Schedules a new cron job or updates an existing one. If a job with the
     * same ID already exists, it will be destroyed and replaced. Use this
     * method to create, restart, and update cron jobs.
     *
     * @note We assume that the controller has validated that the start date is in the future
     * and when provided, that the end date is after the start date.
     * @note "once" tasks don't have an endDate are not scheduled with node-cron
     *
     * TODO: `setTimeout` / `setInterval` delays are stored as a 32-bit signed integer, so the
     * TODO: maximum delay is `2^31 - 1` ms (~24.85 days). This method arms start and end with a single
     * TODO:  `setTimeout(msToStart)` / `setTimeout(msToEnd)`. If `startDate` or `endDate` is farther
     * TODO: than that from `now`, the delay overflows/clamps and the callback can fire much earlier
     * TODO: than intended (while later recurring ticks from `node-cron` remain fine). Mitigations:
     * TODO: reject far-future start/end in create/update validation; or replace long one-shot timers
     * TODO: with chained shorter timeouts / a poll until `now >= startDate` / `now >= endDate`.
     *
     * @param payload - The cron job payload
     */
    public schedule(payload: SchedulePayload): void {
        const delegator = Delegator.getInstance();

        const jobId = payload.jobId;

        const startDate = new Date(payload.startDate);
        const endDate = payload.endDate ? new Date(payload.endDate) : null;
        const now = new Date();

        const type = payload.type;
        const isOfTypeOnce = type === cronJobTypeSchema.enum.once;

        const isStopped = payload.isStopped === true;

        let cronTask: ReturnType<typeof cron.createTask> | undefined;
        let cronExpression: string | undefined;

        this.teardown(jobId);

        if (type !== 'once') {
            cronExpression = this.formatCronExpression({ startDate, type });

            if (!cronExpression) {
                throw new InternalException(`Cron expression is undefined for job: ${jobId}`);
            }

            const isValid = cron.validate(cronExpression);

            if (!isValid) {
                throw new InternalException(`Invalid cron expression: ${cronExpression} for job: ${jobId}`);
            }

            cronTask = cron.createTask(cronExpression, () => {
                delegator.delegateScheduledJob(jobId);
            });
        }

        const newCronJob: CronJob = {
            jobId,
            userId: payload.userId,
            cronExpression,
            startDate,
            endDate,
            type,
            cronTask,
            status: isStopped ? jobScheduleStoppedStatusSchema.value : jobScheduleIdleStatusSchema.value,
            metadata: {
                startTimeoutId: undefined,
                stopTimeoutId: undefined,
            },
        };

        if (!isStopped) {
            const msToStart = startDate.getTime() - now.getTime();
            newCronJob.metadata.startTimeoutId = setTimeout(() => {
                if (isOfTypeOnce) {
                    delegator.delegateScheduledJob(jobId);
                    this.delete(jobId);
                } else {
                    // 1. When the startDate was in the future when this callback was created, we delegate the job,
                    // and then start the task to run at the next interval. Because if we would only start the task,
                    // node-cron would schedule it to run in the next interval, because we're a tick late here
                    const startWasInTheFuture = msToStart > 0;
                    if (startWasInTheFuture) {
                        delegator.delegateScheduledJob(jobId);
                    }

                    // 2. When the startDate is in the past, we only .start() the task,
                    // so it runs in the next interval
                    cronTask!.start();
                }

                logger.info(`Executed job: ${jobId} of type: ${type}`);
            }, msToStart);

            if (endDate) {
                const msToEnd = endDate.getTime() - now.getTime();

                newCronJob.metadata.stopTimeoutId = setTimeout(() => {
                    cronTask!.stop();
                    newCronJob.status = jobScheduleStoppedStatusSchema.value;
                    this.emitAllCronJobs(payload.userId);
                    logger.info(`Stopped job: ${jobId} of type: ${type}`);
                }, msToEnd);
            }
        }

        this.cronJobs.set(jobId, newCronJob);
        this.emitAllCronJobs(payload.userId);
    }

    /**
     * Clears timeouts, destroys the cron task, and removes the job from memory.
     * Does not emit — callers that need SSE notify after teardown (or after a
     * subsequent schedule) must do so themselves.
     *
     * @returns The removed job, or `undefined` if it was not in the map
     */
    private teardown(jobId: string): CronJob | undefined {
        const cronJob = this.cronJobs.get(jobId);
        if (!cronJob) {
            return undefined;
        }

        clearTimeout(cronJob.metadata.startTimeoutId);
        clearTimeout(cronJob.metadata.stopTimeoutId);

        if (cronJob.cronTask) {
            cronJob.cronTask.destroy();
        }

        this.cronJobs.delete(jobId);
        return cronJob;
    }

    /**
     * Removes a cron job from the scheduler and emits the updated scheduled-jobs
     * snapshot for that user. Idempotent when the job is already absent.
     *
     * @param jobId - The cron job id to delete
     */
    public delete(jobId: string): void {
        const cronJob = this.teardown(jobId);

        if (!cronJob) {
            // Note: If .schedule() throws due to invalid cron expression, createJob/updateJob
            // controllers will catch and call this method with a jobId that is not in the map.
            // But since we want to be able to idempotently delete a job, we only log an error
            // and continue.
            logger.error(`Could not find and delete cron-job with id: "${jobId}"`, {});
            return;
        }

        this.emitAllCronJobs(cronJob.userId);
        logger.info(`Deleted cron-job with id: "${jobId}"`);
    }

    /**
     * Returns an immutable snapshot of cron jobs currently in memory.
     */
    public getAllJobs(): ReadonlyArray<CronJob> {
        return Array.from(this.cronJobs.values()).map(job => ({
            ...job,
            metadata: { ...job.metadata },
        }));
    }
}
