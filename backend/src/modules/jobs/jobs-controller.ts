import { Request, Response } from 'express';

import { BusinessLogicException } from 'aop/exceptions';
import { ErrorCode } from 'aop/exceptions/shared/enums';
import { sendSSE } from 'aop/http/sse';
import { logger } from 'aop/logging';

import mappers from './mappers';
import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type {
    ChangeCronJobStatusPayload,
    CreateJobInput,
    EnrichedJob,
    EnrichedJobSchedule,
    IdRouteParam,
    UpdateJobInput,
} from './types';
import type { ScheduledJobEvent } from 'shared/types/jobs/events/types-jobs-events';
import type { EventTypeToPayloadMap } from 'shared/types/jobs/events/types-jobs-events';

import { cronJobTypeSchema } from 'shared/schemas/cron';
import { jobScheduleIdleStatusSchema, jobScheduleStoppedStatusSchema } from 'shared/schemas/jobs';

/**
 * Creates a new job. Optionally schedules it (active) or leaves it stopped;
 * without a schedule, runs tools immediately after save.
 *
 * FR-JOBS-CRT-001 — Create with or without a schedule
 * FR-JOBS-CRT-002 — No schedule → run tools immediately after save (FR-JOBS-RUN-001)
 * FR-JOBS-CRT-003 — Active schedule → save and activate (FR-JOBS-SCH-004/005)
 * FR-JOBS-CRT-004 — Save failure → do not schedule or run
 * FR-JOBS-CRT-005 — Post-save schedule/run failure → keep job, unattached runtime, warn (FR-JOBS-SCH-007/011, FR-JOBS-STR-004/005)
 * FR-JOBS-CRT-006 — Stopped schedule → attach runtime stopped; no run until activated (FR-JOBS-SSC-002)
 * FR-JOBS-UNQ-001 / FR-JOBS-UNQ-002 — Per-user name uniqueness (DB unique index → ConflictException)
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Job belongs to creating user; owner-scoped create
 * Middleware: FR-JOBS-TLR-001…006, FR-JOBS-SCH-001…003/006, FR-JOBS-ONCE-001/002
 */
const createJob = async (req: Request<unknown, unknown, CreateJobInput>, res: Response) => {
    try {
        // FR-JOBS-OWN-001 — Stamp owning user on create
        const createJobPayload = {
            userId: req.context.user.id,
            name: req.body.name,
            tools: req.body.tools.map(tool => mappers.mapToIds(tool)),
            schedule: req.body.schedule,
            createdAt: new Date().toISOString(),
            updatedAt: null,
        };

        // FR-JOBS-CRT-004 — Persist first; schedule/run only after a successful save
        const createdJob = await req.context.db.repository.jobs.create(createJobPayload);

        let schedule: EnrichedJobSchedule | null = null;
        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (createdJob.schedule) {
                if (createdJob.schedule.status === jobScheduleIdleStatusSchema.value) {
                    // FR-JOBS-CRT-003 — Active (`idle`) schedule: place in active runtime state
                    req.context.scheduler.schedule({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        type: createdJob.schedule.type,
                        startDate: createdJob.schedule.startDate,
                        endDate: createdJob.schedule.endDate,
                    });

                    const { nextRun } = req.context.scheduler.getNextAndPreviousRun(createdJob.id);

                    schedule = {
                        ...createdJob.schedule,
                        nextRun: nextRun?.toISOString() || null,
                        lastRun: null,
                    };

                    req.context.delegator.register({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        tools: createdJob.tools,
                        scheduleType: createdJob.schedule.type,
                    });
                } else if (createdJob.schedule.status === jobScheduleStoppedStatusSchema.value) {
                    // FR-JOBS-CRT-006 / FR-JOBS-SSC-002 — Stopped: attach runtime without arming start/end
                    req.context.scheduler.schedule({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        type: createdJob.schedule.type,
                        startDate: createdJob.schedule.startDate,
                        endDate: createdJob.schedule.endDate,
                        isStopped: true,
                    });

                    schedule = {
                        ...createdJob.schedule,
                        nextRun: null,
                        lastRun: null,
                    };

                    // Register so later activation can delegate when the schedule fires
                    req.context.delegator.register({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        tools: createdJob.tools,
                        scheduleType: createdJob.schedule.type,
                    });
                } else {
                    createdJob.schedule.status satisfies never;
                }
            } else {
                // FR-JOBS-CRT-002 / FR-JOBS-RUN-001 — No schedule: run tools immediately
                req.context.delegator.delegate({
                    jobId: createdJob.id,
                    userId: req.context.user.id,
                    tools: createdJob.tools,
                    scheduleType: null,
                });
            }
        } catch (error) {
            // FR-JOBS-CRT-005 / FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 —
            // Keep saved job + intent; wipe half-attached runtime; surface warning for retry
            const logMessage = createdJob.schedule ? 'Failed to schedule job' : 'Failed to delegate job';
            logger.error(logMessage, { error: error as Error });

            const message = createdJob.schedule
                ? ErrorMessage.JOBS_FAILED_TO_SCHEDULE_JOB
                : ErrorMessage.JOBS_FAILED_TO_DELEGATE_JOB;
            const code = createdJob.schedule
                ? ErrorCode.JOBS_FAILED_TO_SCHEDULE_JOB
                : ErrorCode.JOBS_FAILED_TO_DELEGATE_JOB;
            warnings.push({ code, message });

            req.context.scheduler.delete(createdJob.id);
            req.context.delegator.removeJob(createdJob.id);

            if (createdJob.schedule) {
                schedule = {
                    ...createdJob.schedule,
                    nextRun: null,
                    lastRun: null,
                };
            }
        }

        // FR-JOBS-STR-004 — Warnings in meta make post-save operational failure observable
        res.status(HttpStatusCode.CREATED).json({
            success: true,
            data: {
                ...createdJob,
                schedule,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...(warnings.length && { warnings }),
            },
        });
    } catch (error) {
        logger.error('Failed to create job', { error: error as Error });
        throw error;
    }
};

/**
 * Updates an existing job’s name, tools, and schedule.
 *
 * FR-JOBS-UPD-001 — Update name, tools, schedule (rename subject to FR-JOBS-UNQ-002)
 * FR-JOBS-UPD-002 — Allow clearing the schedule
 * FR-JOBS-UPD-003 — Reject while the job is running
 * FR-JOBS-UPD-004 — Stopped schedule → attach runtime stopped; no run until activated (FR-JOBS-SSC-002)
 * FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 — Post-save schedule/run failure → keep job, unattached, warn
 * FR-JOBS-RUN-001 — Clearing schedule with runJob → run tools after save
 * FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Owner-scoped update; other-user ≡ not found
 * Middleware: FR-JOBS-TLR-001…006, FR-JOBS-SCH-001…003/006, FR-JOBS-ONCE-001/002
 */
const updateJob = async (req: Request<IdRouteParam, unknown, UpdateJobInput>, res: Response) => {
    try {
        // FR-JOBS-UPD-003 — Reject while running
        const runningJob = req.context.delegator.runningJobs.get(req.params.id);
        if (runningJob?.userId === req.context.user.id) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_UPDATED_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-002 — Ownership stamped on update payload (repo enforces OWN-003)
        const updateJobPayload = {
            id: req.params.id,
            userId: req.context.user.id,
            name: req.body.name,
            schedule: req.body.schedule,
            tools: req.body.tools.map(tool => mappers.mapToIds(tool)),
            updatedAt: new Date().toISOString(),
        };

        // Persist first; schedule/run only after a successful save (same CRT-004 ordering)
        const updatedJob = await req.context.db.repository.jobs.update(updateJobPayload);

        let schedule: EnrichedJobSchedule | null = null;
        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (updatedJob.schedule) {
                if (updatedJob.schedule.status === jobScheduleIdleStatusSchema.value) {
                    // FR-JOBS-UPD-001 — Active (`idle`) schedule: replace any existing runtime attachment
                    // Note: .schedule() destroys an existing cron job before scheduling a new one
                    req.context.scheduler.schedule({
                        jobId: updatedJob.id,
                        userId: req.context.user.id,
                        type: updatedJob.schedule.type,
                        startDate: updatedJob.schedule.startDate,
                        endDate: updatedJob.schedule.endDate,
                    });

                    const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(updatedJob.id);

                    schedule = {
                        ...updatedJob.schedule,
                        nextRun: nextRun?.toISOString() || null,
                        lastRun: previousRun?.toISOString() || null,
                    };

                    // Note: .register() replaces an existing task with the new one
                    req.context.delegator.register({
                        jobId: updatedJob.id,
                        userId: req.context.user.id,
                        tools: updatedJob.tools,
                        scheduleType: updatedJob.schedule.type,
                    });
                } else if (updatedJob.schedule.status === jobScheduleStoppedStatusSchema.value) {
                    // FR-JOBS-UPD-004 / FR-JOBS-SSC-002 — Stopped: overwrite runtime without arming start/end
                    // Note: .schedule() destroys an existing cron job before scheduling a new one
                    req.context.scheduler.schedule({
                        jobId: updatedJob.id,
                        userId: req.context.user.id,
                        type: updatedJob.schedule.type,
                        startDate: updatedJob.schedule.startDate,
                        endDate: updatedJob.schedule.endDate,
                        isStopped: true,
                    });

                    schedule = {
                        ...updatedJob.schedule,
                        nextRun: null,
                        lastRun: null,
                    };

                    // Register so later activation can delegate when the schedule fires
                    req.context.delegator.register({
                        jobId: updatedJob.id,
                        userId: req.context.user.id,
                        tools: updatedJob.tools,
                        scheduleType: updatedJob.schedule.type,
                    });
                } else {
                    updatedJob.schedule.status satisfies never;
                }
            } else {
                // FR-JOBS-UPD-002 — Clear schedule: detach runtime
                req.context.scheduler.delete(updatedJob.id);
                req.context.delegator.removeJob(updatedJob.id);

                // FR-JOBS-RUN-001 — Optionally run tools immediately after clearing schedule
                if (req.body.runJob) {
                    req.context.delegator.delegate({
                        jobId: updatedJob.id,
                        userId: req.context.user.id,
                        tools: updatedJob.tools,
                        scheduleType: null,
                    });
                }
            }
        } catch (error) {
            // FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 — Keep saved job; wipe runtime; warn
            const logMessage = updatedJob.schedule ? 'Failed to schedule job' : 'Failed to delegate job';
            logger.error(logMessage, { error: error as Error });

            const message = updatedJob.schedule
                ? ErrorMessage.JOBS_FAILED_TO_SCHEDULE_JOB
                : ErrorMessage.JOBS_FAILED_TO_DELEGATE_JOB;
            const code = updatedJob.schedule
                ? ErrorCode.JOBS_FAILED_TO_SCHEDULE_JOB
                : ErrorCode.JOBS_FAILED_TO_DELEGATE_JOB;
            warnings.push({ code, message });

            req.context.scheduler.delete(updatedJob.id);
            req.context.delegator.removeJob(updatedJob.id);

            if (updatedJob.schedule) {
                schedule = {
                    ...updatedJob.schedule,
                    nextRun: null,
                    lastRun: null,
                };
            }
        }

        // FR-JOBS-STR-004 — Warnings in meta make post-save operational failure observable
        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                ...updatedJob,
                schedule,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...(warnings.length && { warnings }),
            },
        });
    } catch (error) {
        logger.error('Failed to update job', { error: error as Error });
        throw error;
    }
};

/**
 * Deletes a job by ID.
 *
 * FR-JOBS-DEL-001 — Delete so the job is no longer available and no longer runs
 * FR-JOBS-DEL-002 — After deletion, the job is not returned to the owner
 * FR-JOBS-DEL-003 — Reject deletion while the job is running
 * FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Owner-scoped delete; other-user ≡ not found
 */
const deleteJob = async (req: Request<IdRouteParam>, res: Response) => {
    const { id } = req.params;
    const userId = req.context.user.id;

    // FR-JOBS-DEL-003 — Reject while running
    const runningJob = req.context.delegator.runningJobs.get(id);
    if (runningJob?.userId === userId) {
        throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_DELETED_WHILE_RUNNING);
    }

    try {
        // FR-JOBS-DEL-001 / FR-JOBS-DEL-002 / FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Persist deletion (ownership-scoped)
        const result = await req.context.db.repository.jobs.delete(id, userId);

        // FR-JOBS-DEL-001 — Detach runtime so the job no longer runs
        req.context.scheduler.delete(id);
        req.context.delegator.removeJob(id);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: { id: result.id },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('Failed to delete job', { error: error as Error });
        throw error;
    }
};

/**
 * Retrieves a single job by ID.
 *
 * FR-JOBS-GET-001 — Return a job that belongs to the requesting user
 * FR-JOBS-GET-002 — For scheduled jobs, include next run and last run when applicable
 * FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Owner-scoped get; other-user ≡ not found
 * FR-JOBS-STR-005 — Persisted schedule intent remains visible even if runtime is unattached
 */
const getJob = async (req: Request<IdRouteParam>, res: Response) => {
    const { id } = req.params;
    const userId = req.context.user.id;

    // FR-JOBS-GET-001 / FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Ownership-scoped fetch
    const job = await req.context.db.repository.jobs.getById(id, userId);

    let schedule: EnrichedJobSchedule | null = null;
    if (job.schedule) {
        // FR-JOBS-GET-002 — Enrich with next/last run from runtime (null when unattached)
        const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(id);
        schedule = {
            ...job.schedule,
            nextRun: nextRun?.toISOString() || null,
            lastRun: previousRun?.toISOString() || null,
        };
    }

    const enrichedJob: EnrichedJob = { ...job, schedule };

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: enrichedJob,
        meta: {
            timestamp: new Date().toISOString(),
        },
    });
};

/**
 * Retrieves all jobs for the requesting user with pagination.
 *
 * FR-JOBS-LST-001 — Return jobs that belong to the requesting user
 * FR-JOBS-LST-002 — Support limit and offset
 * FR-JOBS-GET-002 — For scheduled jobs, include next run and last run when applicable
 * FR-JOBS-OWN-002 — Owner-scoped via repository getAllByUserId
 * FR-JOBS-STR-005 — Persisted schedule intent remains visible even if runtime is unattached
 */
const getAllJobs = async (req: Request, res: Response) => {
    const userId = req.context.user.id;

    // FR-JOBS-LST-002 — Limit = page size; offset = number of jobs to skip
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 0;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // FR-JOBS-LST-001 / FR-JOBS-OWN-002
    const jobs = await req.context.db.repository.jobs.getAllByUserId(userId, limit, offset);

    const enrichedJobs: EnrichedJob[] = jobs.map(job => {
        if (job.schedule) {
            // FR-JOBS-GET-002 — Enrich with next/last run from runtime (null when unattached)
            const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(job.id);
            return {
                ...job,
                schedule: {
                    ...job.schedule,
                    nextRun: nextRun?.toISOString() || null,
                    lastRun: previousRun?.toISOString() || null,
                },
            };
        }

        return {
            ...job,
            schedule: null,
        };
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: enrichedJobs,
        limit,
        offset,
        count: enrichedJobs.length,
        meta: {
            timestamp: new Date().toISOString(),
        },
    });
};

/**
 * Changes a job’s schedule status to active (`idle`) or stopped.
 *
 * FR-JOBS-SSC-001 — Set schedule status to active or stopped
 * FR-JOBS-SSC-002 — Stopped schedule shall not run until activated
 * FR-JOBS-SSC-003 — Observe updated schedule status on success
 * FR-JOBS-SSC-004 — Reject status change to the status the job already has
 * FR-JOBS-SSC-005 — Reject when the job has no schedule
 * FR-JOBS-SSC-006 — Reject while the job is running
 * FR-JOBS-SCH-006 — Reject activating a recurring schedule whose end time is past
 * FR-JOBS-ONCE-002 — Reject activating a once schedule whose start time is past
 * FR-JOBS-SCH-007 / FR-JOBS-SCH-008 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 —
 *   Persist owner intent first; post-save attach failure → keep intent, unattached runtime, warn
 * FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Owner-scoped; other-user ≡ not found
 */
const changeJobScheduleStatus = async (
    req: Request<IdRouteParam, unknown, ChangeCronJobStatusPayload>,
    res: Response
) => {
    try {
        const jobId = req.params.id;
        const userId = req.context.user.id;
        const requestedStatus = req.body.status;

        // FR-JOBS-SSC-006 — Reject while running
        const runningJob = req.context.delegator.runningJobs.get(jobId);
        if (runningJob?.userId === userId) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Ownership-scoped fetch
        const persistedJob = await req.context.db.repository.jobs.getById(jobId, userId);

        // FR-JOBS-SSC-005
        if (!persistedJob.schedule) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WITHOUT_SCHEDULE);
        }

        // FR-JOBS-SSC-004 / FR-JOBS-SCH-008 — Compare against persisted owner intent
        if (persistedJob.schedule.status === requestedStatus) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_TO_EXISTING_STATUS);
        }

        if (requestedStatus === jobScheduleIdleStatusSchema.value) {
            // FR-JOBS-SCH-006 — Recurring: cannot activate when end is now/past
            if (persistedJob.schedule.endDate) {
                const endDate = new Date(persistedJob.schedule.endDate);
                if (endDate.getTime() <= Date.now()) {
                    throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_OF_EXPIRED_SCHEDULE);
                }
            }

            // FR-JOBS-ONCE-002 — Once: cannot activate when start is now/past
            if (persistedJob.schedule.type === cronJobTypeSchema.enum.once) {
                const startDate = new Date(persistedJob.schedule.startDate);
                if (startDate.getTime() <= Date.now()) {
                    throw new BusinessLogicException(
                        ErrorMessage.JOBS_CANNOT_ACTIVATE_ONCE_SCHEDULE_WITH_PAST_START_DATE
                    );
                }
            }
        }

        // FR-JOBS-SCH-007 / FR-JOBS-SCH-008 — Persist intent first so retry remains possible if attach fails
        const updatedJob = await req.context.db.repository.jobs.update({
            id: jobId,
            userId,
            name: persistedJob.name,
            tools: persistedJob.tools,
            schedule: {
                ...persistedJob.schedule,
                status: requestedStatus,
            },
            updatedAt: new Date().toISOString(),
        });

        let schedule: EnrichedJobSchedule = {
            ...updatedJob.schedule!,
            nextRun: null,
            lastRun: null,
        };
        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (requestedStatus === jobScheduleIdleStatusSchema.value) {
                // FR-JOBS-SSC-001 — Activate: place schedule in active runtime state
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedJob.schedule.type,
                    startDate: persistedJob.schedule.startDate,
                    endDate: persistedJob.schedule.endDate,
                });

                const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(jobId);
                schedule = {
                    ...updatedJob.schedule!,
                    nextRun: nextRun?.toISOString() || null,
                    lastRun: previousRun?.toISOString() || null,
                };

                // Re-register so activation works after a prior schedule-failure cleanup
                req.context.delegator.register({
                    jobId: persistedJob.id,
                    userId,
                    tools: persistedJob.tools,
                    scheduleType: persistedJob.schedule.type,
                });
            } else if (requestedStatus === jobScheduleStoppedStatusSchema.value) {
                // FR-JOBS-SSC-001 / FR-JOBS-SSC-002 — Stop: attach runtime stopped (no run until activated)
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedJob.schedule.type,
                    startDate: persistedJob.schedule.startDate,
                    endDate: persistedJob.schedule.endDate,
                    isStopped: true,
                });

                schedule = {
                    ...updatedJob.schedule!,
                    nextRun: null,
                    lastRun: null,
                };

                req.context.delegator.register({
                    jobId: persistedJob.id,
                    userId,
                    tools: persistedJob.tools,
                    scheduleType: persistedJob.schedule.type,
                });
            } else {
                requestedStatus satisfies never;
            }
        } catch (error) {
            // FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 —
            // Keep persisted intent; wipe half-attached runtime. Missing runtime + saved intent =
            // operational failure (client offers retry). Do not fake a stopped cron.
            logger.error('Failed to change job schedule status in runtime', { error: error as Error });
            warnings.push({
                code: ErrorCode.JOBS_FAILED_TO_SCHEDULE_JOB,
                message: ErrorMessage.JOBS_FAILED_TO_SCHEDULE_JOB,
            });

            req.context.scheduler.delete(jobId);
            req.context.delegator.removeJob(jobId);

            schedule = {
                ...updatedJob.schedule!,
                nextRun: null,
                lastRun: null,
            };
        }

        // FR-JOBS-SSC-003 / FR-JOBS-STR-004 — Updated status (+ optional warning) observable on success
        const enrichedJob: EnrichedJob = {
            ...updatedJob,
            schedule,
        };

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: enrichedJob,
            meta: {
                timestamp: new Date().toISOString(),
                ...(warnings.length && { warnings }),
            },
        });
    } catch (error) {
        logger.error('Failed to change job schedule status', { error: error as Error });
        throw error;
    }
};

/**
 * Retries attaching a job’s schedule to the runtime without changing persisted intent.
 *
 * FR-JOBS-SCH-007 — Retry scheduling from the saved job until it succeeds (no recreate)
 * FR-JOBS-SCH-008 — Does not change persisted schedule status (owner intent)
 * FR-JOBS-SCH-011 / FR-JOBS-STR-004 — Attach failure → leave unattached, report warning
 * FR-JOBS-SCH-006 — Reject retry to active when recurring end is now/past
 * FR-JOBS-ONCE-002 — Reject retry to active when once start is now/past
 * FR-JOBS-OWN-002 / FR-JOBS-OWN-003 — Owner-scoped; other-user ≡ not found
 */
const retryJobSchedule = async (req: Request<IdRouteParam>, res: Response) => {
    try {
        const jobId = req.params.id;
        const userId = req.context.user.id;

        const runningJob = req.context.delegator.runningJobs.get(jobId);
        if (runningJob?.userId === userId) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-002 / FR-JOBS-OWN-003
        const persistedJob = await req.context.db.repository.jobs.getById(jobId, userId);

        if (!persistedJob.schedule) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WITHOUT_SCHEDULE);
        }

        const persistedSchedule = persistedJob.schedule;

        if (persistedSchedule.status === jobScheduleIdleStatusSchema.value) {
            // FR-JOBS-SCH-006
            if (persistedSchedule.endDate) {
                const endDate = new Date(persistedSchedule.endDate);
                if (endDate.getTime() <= Date.now()) {
                    throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_OF_EXPIRED_SCHEDULE);
                }
            }

            // FR-JOBS-ONCE-002
            if (persistedSchedule.type === cronJobTypeSchema.enum.once) {
                const startDate = new Date(persistedSchedule.startDate);
                if (startDate.getTime() <= Date.now()) {
                    throw new BusinessLogicException(
                        ErrorMessage.JOBS_CANNOT_ACTIVATE_ONCE_SCHEDULE_WITH_PAST_START_DATE
                    );
                }
            }
        }

        // FR-JOBS-SCH-008 — Do not rewrite persisted status; only re-attach runtime to saved intent
        let schedule: EnrichedJobSchedule = {
            ...persistedSchedule,
            nextRun: null,
            lastRun: null,
        };
        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (persistedSchedule.status === jobScheduleIdleStatusSchema.value) {
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedSchedule.type,
                    startDate: persistedSchedule.startDate,
                    endDate: persistedSchedule.endDate,
                });

                const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(jobId);
                schedule = {
                    ...persistedSchedule,
                    nextRun: nextRun?.toISOString() || null,
                    lastRun: previousRun?.toISOString() || null,
                };
            } else if (persistedSchedule.status === jobScheduleStoppedStatusSchema.value) {
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedSchedule.type,
                    startDate: persistedSchedule.startDate,
                    endDate: persistedSchedule.endDate,
                    isStopped: true,
                });
            } else {
                persistedSchedule.status satisfies never;
            }

            req.context.delegator.register({
                jobId: persistedJob.id,
                userId,
                tools: persistedJob.tools,
                scheduleType: persistedSchedule.type,
            });
        } catch (error) {
            // FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004
            logger.error('Failed to retry job schedule in runtime', { error: error as Error });
            warnings.push({
                code: ErrorCode.JOBS_FAILED_TO_SCHEDULE_JOB,
                message: ErrorMessage.JOBS_FAILED_TO_SCHEDULE_JOB,
            });

            req.context.scheduler.delete(jobId);
            req.context.delegator.removeJob(jobId);

            schedule = {
                ...persistedSchedule,
                nextRun: null,
                lastRun: null,
            };
        }

        const enrichedJob: EnrichedJob = {
            ...persistedJob,
            schedule,
        };

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: enrichedJob,
            meta: {
                timestamp: new Date().toISOString(),
                ...(warnings.length && { warnings }),
            },
        });
    } catch (error) {
        logger.error('Failed to retry job schedule', { error: error as Error });
        throw error;
    }
};

/**
 * Streams live job activity and schedule-attachment state for the current user.
 *
 * FR-JOBS-STR-001 — Live stream of running jobs and execution outcomes
 * FR-JOBS-STR-003 — Present live state without full page reload (client consumes this stream)
 * FR-JOBS-STR-004 — Schedule attach/detach observable for retry (FR-JOBS-SCH-007 / SCH-011)
 * FR-JOBS-OWN-002 — Events filtered to the requesting owner
 */
const streamJobs = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const userId = req.context.user.id;

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Snapshot: running jobs for this owner
    const runningJobIds: string[] = [];
    for (const [jobId, job] of req.context.delegator.runningJobs.entries()) {
        if (job.userId === userId) {
            runningJobIds.push(jobId);
        }
    }
    sendSSE(res, { runningJobs: runningJobIds, type: constants.events.jobs.runningJobs });

    // FR-JOBS-STR-004 / FR-JOBS-OWN-002 — Snapshot: schedule runtime attachment for this owner
    const scheduledJobs: ScheduledJobEvent[] = [];
    for (const job of req.context.scheduler.getAllJobs()) {
        if (job.userId === userId) {
            scheduledJobs.push({
                jobId: job.jobId,
                status: job.status,
            });
        }
    }
    sendSSE(res, {
        scheduledJobs,
        userId,
        type: constants.events.jobs.scheduledJobs,
    });

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Replay in-flight target events for still-running jobs
    for (const event of req.context.emitter.allEmittedJobTargetEvents) {
        if (event.userId === userId && req.context.delegator.runningJobs.has(event.jobId)) {
            sendSSE(res, event);
        }
    }

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Live: running-jobs updates
    const onRunningJobs = (event: EventTypeToPayloadMap[typeof constants.events.jobs.runningJobs]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.runningJobs, onRunningJobs);

    // FR-JOBS-STR-004 / FR-JOBS-OWN-002 — Live: schedule attachment updates
    const onScheduledJobs = (event: EventTypeToPayloadMap[typeof constants.events.jobs.scheduledJobs]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.scheduledJobs, onScheduledJobs);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Live: target finished
    const onTargetFinished = (event: EventTypeToPayloadMap[typeof constants.events.jobs.targetFinished]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.targetFinished, onTargetFinished);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Live: job finished
    const onJobFinished = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFinished]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobFinished, onJobFinished);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-002 — Live: job failed
    const onJobFailed = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFailed]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobFailed, onJobFailed);

    req.on('close', () => {
        req.context.emitter.off(constants.events.jobs.runningJobs, onRunningJobs);
        req.context.emitter.off(constants.events.jobs.scheduledJobs, onScheduledJobs);
        req.context.emitter.off(constants.events.jobs.targetFinished, onTargetFinished);
        req.context.emitter.off(constants.events.jobs.jobFinished, onJobFinished);
        req.context.emitter.off(constants.events.jobs.jobFailed, onJobFailed);
    });
};

export { changeJobScheduleStatus, createJob, deleteJob, getAllJobs, getJob, retryJobSchedule, streamJobs, updateJob };
