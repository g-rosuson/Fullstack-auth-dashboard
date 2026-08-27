import { Request, Response } from 'express';

import { BusinessLogicException } from 'aop/exceptions';
import { ErrorCode } from 'aop/exceptions/shared/enums';
import { openSSE, sendSSE } from 'aop/http/sse';
import { logger } from 'aop/logging';

import mappers from './mappers';
import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { ChangeCronJobStatusPayload, CreateJobInput, IdRouteParam, UpdateJobInput } from './types';
import type { AggregatedRunningJob, ScheduledJobEvent } from 'shared/types/jobs/events/types-jobs-events';
import type { EventTypeToPayloadMap } from 'shared/types/jobs/events/types-jobs-events';

import { cronJobTypeSchema } from 'shared/schemas/cron';

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
 * FR-JOBS-UNQ-001 — Per-user name uniqueness (DB unique index → ConflictException)
 * FR-JOBS-OWN-001 — Job belongs to creating user; owner-scoped create
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

        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (createdJob.schedule) {
                if (createdJob.schedule.status === constants.status.schedule.idle) {
                    // FR-JOBS-CRT-003 — Active (`idle`) schedule: place in active runtime state
                    req.context.scheduler.schedule({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        type: createdJob.schedule.type,
                        startDate: createdJob.schedule.startDate,
                        endDate: createdJob.schedule.endDate,
                    });

                    req.context.delegator.register({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        tools: createdJob.tools,
                        scheduleType: createdJob.schedule.type,
                    });
                } else if (createdJob.schedule.status === constants.status.schedule.stopped) {
                    // FR-JOBS-CRT-006 / FR-JOBS-SSC-002 — Stopped: attach runtime without arming start/end
                    req.context.scheduler.schedule({
                        jobId: createdJob.id,
                        userId: req.context.user.id,
                        type: createdJob.schedule.type,
                        startDate: createdJob.schedule.startDate,
                        endDate: createdJob.schedule.endDate,
                        isStopped: true,
                    });

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

            // FR-JOBS-STR-004 – scheduler.delete() removes the job and emitts the user's current scheduled jobs
            req.context.scheduler.delete(createdJob.id);
            req.context.delegator.removeJob(createdJob.id);
        }

        // FR-JOBS-STR-004 — Warnings in meta make post-save operational failure observable
        res.status(HttpStatusCode.CREATED).json({
            success: true,
            data: createdJob,
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
 * FR-JOBS-UPD-001 — Update name, tools, schedule (rename subject to FR-JOBS-UNQ-001)
 * FR-JOBS-UPD-002 — Allow clearing the schedule
 * FR-JOBS-UPD-003 — Reject while the job is running
 * FR-JOBS-UPD-004 — Stopped schedule → attach runtime stopped; no run until activated (FR-JOBS-SSC-002)
 * FR-JOBS-UPD-005 — Update does not start a run (on demand / schedule fire only)
 * FR-JOBS-SCH-007 / FR-JOBS-SCH-011 / FR-JOBS-STR-004 — Post-save schedule/run failure → keep job, unattached, warn
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped update; other-user ≡ not found
 * Middleware: FR-JOBS-TLR-001…006, FR-JOBS-SCH-001…003/006, FR-JOBS-ONCE-001/002
 */
// TODO: When a start date is in the past, we cannot update any job fields since the middleware validates the schedule.
// TODO: We should allow updating name and tools, since there are scenarios where users want to update these fields after the schedule started.
// TODO: Furthermore, I think it's fine to allow this also when the end date is in the past, validate assumptions.
const updateJob = async (req: Request<IdRouteParam, unknown, UpdateJobInput>, res: Response) => {
    try {
        const userId = req.context.user.id;

        // FR-JOBS-UPD-003 — Reject while running
        const isJobRunningForUser = req.context.delegator
            .getRunningJobsForUser(userId)
            .some(job => job.jobId === req.params.id);
        if (isJobRunningForUser) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_UPDATED_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-001 — Ownership stamped on update payload (repo enforces OWN-002)
        const updateJobPayload = {
            id: req.params.id,
            userId,
            name: req.body.name,
            schedule: req.body.schedule,
            tools: req.body.tools.map(tool => mappers.mapToIds(tool)),
            updatedAt: new Date().toISOString(),
        };

        // Persist first; schedule/run only after a successful save (same CRT-004 ordering)
        const updatedJob = await req.context.db.repository.jobs.update(updateJobPayload);

        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (updatedJob.schedule) {
                if (updatedJob.schedule.status === constants.status.schedule.idle) {
                    // FR-JOBS-UPD-001 — Active (`idle`) schedule: replace any existing runtime attachment
                    // Note: .schedule() destroys an existing cron job before scheduling a new one
                    req.context.scheduler.schedule({
                        jobId: updatedJob.id,
                        userId,
                        type: updatedJob.schedule.type,
                        startDate: updatedJob.schedule.startDate,
                        endDate: updatedJob.schedule.endDate,
                    });

                    // Note: .register() replaces an existing task with the new one
                    req.context.delegator.register({
                        jobId: updatedJob.id,
                        userId,
                        tools: updatedJob.tools,
                        scheduleType: updatedJob.schedule.type,
                    });
                } else if (updatedJob.schedule.status === constants.status.schedule.stopped) {
                    // FR-JOBS-UPD-004 / FR-JOBS-SSC-002 — Stopped: overwrite runtime without arming start/end
                    // Note: .schedule() destroys an existing cron job before scheduling a new one
                    req.context.scheduler.schedule({
                        jobId: updatedJob.id,
                        userId,
                        type: updatedJob.schedule.type,
                        startDate: updatedJob.schedule.startDate,
                        endDate: updatedJob.schedule.endDate,
                        isStopped: true,
                    });

                    // Register so later activation can delegate when the schedule fires
                    req.context.delegator.register({
                        jobId: updatedJob.id,
                        userId,
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

            // FR-JOBS-STR-004 – scheduler.delete() removes the job and emitts the user's current scheduled jobs
            req.context.scheduler.delete(updatedJob.id);
            req.context.delegator.removeJob(updatedJob.id);
        }

        // FR-JOBS-STR-004 — Warnings in meta make post-save operational failure observable
        res.status(HttpStatusCode.OK).json({
            success: true,
            data: updatedJob,
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
 * Starts an on-demand run of a job's tools.
 *
 * FR-JOBS-RUN-001 / FR-JOBS-RUN-003 — Execute tools when the owner starts a run
 * FR-JOBS-RUN-004 — Reject while already running
 * FR-JOBS-ONCE-003 — Allowed when a once schedule can no longer activate
 * FR-JOBS-SCH-012 — Allowed when a recurring schedule end is now or past
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped; other-user ≡ not found
 *
 * Tools start after the response. Clients observe via SSE `running-jobs` / finished events.
 */
const runJob = async (req: Request<IdRouteParam>, res: Response) => {
    try {
        const jobId = req.params.id;
        const userId = req.context.user.id;

        // FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — other-user ≡ not found
        const job = await req.context.db.repository.jobs.getById(jobId, userId);

        // FR-JOBS-RUN-004 — Reject when already running for this owner
        if (req.context.delegator.getRunningJobsForUser(userId).some(running => running.jobId === jobId)) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_RUN_WHILE_RUNNING);
        }

        // FR-JOBS-RUN-001 / FR-JOBS-RUN-003 — Fire-and-forget; do not await tool completion
        req.context.delegator.delegate({
            jobId: job.id,
            userId,
            tools: job.tools,
            scheduleType: job.schedule?.type ?? null,
        });

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                jobId,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('Failed to run job', { error: error as Error });
        throw error;
    }
};

/**
 * Requests cancellation of an in-flight job run.
 *
 * FR-JOBS-STP-001 — Owner may request cancellation of an in-flight run
 * FR-JOBS-STP-002 — Reject stop when the job is not running for that owner
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped; other-user ≡ not found
 * NFR-REL-JOBS-001 — Response returns without waiting for tools to wind down
 *
 * Clients observe completion via SSE `job-cancelled` / `running-jobs` (FR-JOBS-STR-006).
 */
const stopJob = async (req: Request<IdRouteParam>, res: Response) => {
    try {
        const jobId = req.params.id;
        const userId = req.context.user.id;

        // FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — other-user ≡ not found
        await req.context.db.repository.jobs.getById(jobId, userId);

        // FR-JOBS-STP-002 — Reject when not running for this owner
        if (!req.context.delegator.getRunningJobsForUser(userId).some(job => job.jobId === jobId)) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_STOP_WHEN_NOT_RUNNING);
        }

        // FR-JOBS-STP-001 / NFR-REL-JOBS-001 — Request cancel; do not await tool teardown
        req.context.delegator.cancel(jobId);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                jobId,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('Failed to stop job', { error: error as Error });
        throw error;
    }
};

/**
 * Deletes a job by ID.
 *
 * FR-JOBS-DEL-001 — Delete so the job is no longer available and no longer runs
 * FR-JOBS-DEL-002 — After deletion, the job is not returned to the owner
 * FR-JOBS-DEL-003 — Reject deletion while the job is running
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped delete; other-user ≡ not found
 */
const deleteJob = async (req: Request<IdRouteParam>, res: Response) => {
    const { id } = req.params;
    const userId = req.context.user.id;

    // FR-JOBS-DEL-003 — Reject while running
    if (req.context.delegator.getRunningJobsForUser(userId).some(job => job.jobId === id)) {
        throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_DELETED_WHILE_RUNNING);
    }

    try {
        // FR-JOBS-DEL-001 / FR-JOBS-DEL-002 / FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Persist deletion (ownership-scoped)
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
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped get; other-user ≡ not found
 * FR-JOBS-STR-005 — Persisted schedule intent remains visible even if runtime is unattached
 */
const getJob = async (req: Request<IdRouteParam>, res: Response) => {
    const { id } = req.params;
    const userId = req.context.user.id;

    // FR-JOBS-GET-001 / FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Ownership-scoped fetch
    const job = await req.context.db.repository.jobs.getById(id, userId);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: job,
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
 * FR-JOBS-OWN-001 — Owner-scoped via repository getAllByUserId
 * FR-JOBS-STR-005 — Persisted schedule intent remains visible even if runtime is unattached
 */
const getAllJobs = async (req: Request, res: Response) => {
    const userId = req.context.user.id;

    // FR-JOBS-LST-002 — Limit = page size; offset = number of jobs to skip
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 0;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // FR-JOBS-LST-001 / FR-JOBS-OWN-001
    const jobs = await req.context.db.repository.jobs.getAllByUserId(userId, limit, offset);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: jobs,
        limit,
        offset,
        count: jobs.length,
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
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped; other-user ≡ not found
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
        if (req.context.delegator.getRunningJobsForUser(userId).some(job => job.jobId === jobId)) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Ownership-scoped fetch
        const persistedJob = await req.context.db.repository.jobs.getById(jobId, userId);

        // FR-JOBS-SSC-005
        if (!persistedJob.schedule) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WITHOUT_SCHEDULE);
        }

        // FR-JOBS-SSC-004 / FR-JOBS-SCH-008 — Compare against persisted owner intent
        if (persistedJob.schedule.status === requestedStatus) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_TO_EXISTING_STATUS);
        }

        if (requestedStatus === constants.status.schedule.idle) {
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

        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (requestedStatus === constants.status.schedule.idle) {
                // FR-JOBS-SSC-001 — Activate: place schedule in active runtime state
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedJob.schedule.type,
                    startDate: persistedJob.schedule.startDate,
                    endDate: persistedJob.schedule.endDate,
                });

                // Re-register so activation works after a prior schedule-failure cleanup
                req.context.delegator.register({
                    jobId: persistedJob.id,
                    userId,
                    tools: persistedJob.tools,
                    scheduleType: persistedJob.schedule.type,
                });
            } else if (requestedStatus === constants.status.schedule.stopped) {
                // FR-JOBS-SSC-001 / FR-JOBS-SSC-002 — Stop: attach runtime stopped (no run until activated)
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedJob.schedule.type,
                    startDate: persistedJob.schedule.startDate,
                    endDate: persistedJob.schedule.endDate,
                    isStopped: true,
                });

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
        }

        // FR-JOBS-SSC-003 / FR-JOBS-STR-004 — Updated status (+ optional warning) observable on success
        res.status(HttpStatusCode.OK).json({
            success: true,
            data: updatedJob,
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
 * FR-JOBS-OWN-001 / FR-JOBS-OWN-002 — Owner-scoped; other-user ≡ not found
 */
const retryJobSchedule = async (req: Request<IdRouteParam>, res: Response) => {
    try {
        const jobId = req.params.id;
        const userId = req.context.user.id;

        if (req.context.delegator.getRunningJobsForUser(userId).some(job => job.jobId === jobId)) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WHILE_RUNNING);
        }

        // FR-JOBS-OWN-001 / FR-JOBS-OWN-002
        const persistedJob = await req.context.db.repository.jobs.getById(jobId, userId);

        if (!persistedJob.schedule) {
            throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WITHOUT_SCHEDULE);
        }

        const persistedSchedule = persistedJob.schedule;

        if (persistedSchedule.status === constants.status.schedule.idle) {
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
        const warnings: Array<{ code: ErrorCode; message: ErrorMessage }> = [];

        try {
            if (persistedSchedule.status === constants.status.schedule.idle) {
                req.context.scheduler.schedule({
                    jobId: persistedJob.id,
                    userId,
                    type: persistedSchedule.type,
                    startDate: persistedSchedule.startDate,
                    endDate: persistedSchedule.endDate,
                });
            } else if (persistedSchedule.status === constants.status.schedule.stopped) {
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
        }

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: persistedJob,
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
 * FR-JOBS-STR-001 — Live stream of running jobs and execution outcomes (incl. cancel)
 * FR-JOBS-STR-002 — Single aggregated connect snapshot for hydration
 * FR-JOBS-STR-003 — Live schedule-attachment events carry runtime status / next / last run
 * FR-JOBS-STR-004 — Schedule attach/detach observable for retry (FR-JOBS-SCH-007 / SCH-011)
 * FR-JOBS-OWN-001 — Events filtered to the requesting owner
 */
const streamJobs = (req: Request, res: Response) => {
    openSSE(res);

    const userId = req.context.user.id;

    // FR-JOBS-STR-002 / FR-JOBS-OWN-001 — Aggregated connect snapshot
    const targetEventsForUser = req.context.emitter.getEmittedJobTargetEventsForUser(userId);
    const runningJobs: AggregatedRunningJob[] = req.context.delegator
        .getRunningJobsForUser(userId)
        .map(({ jobId }) => ({
            jobId,
            emittedEvents: targetEventsForUser.filter(event => event.jobId === jobId),
        }));
    const scheduledJobEventsForUser: ScheduledJobEvent[] = req.context.scheduler.getCronJobEventsForUser(userId);

    sendSSE(res, {
        runningJobs,
        scheduledJobs: scheduledJobEventsForUser,
        userId,
        type: constants.events.jobs.jobsAggregated,
    });

    // FR-JOBS-STR-001 / FR-JOBS-OWN-001 — Live: running-jobs updates
    const onRunningJobs = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobsRunning]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobsRunning, onRunningJobs);

    // FR-JOBS-STR-003 / FR-JOBS-STR-004 / FR-JOBS-OWN-001 — Live: schedule attachment updates
    const onScheduledJobs = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobsScheduled]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobsScheduled, onScheduledJobs);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-001 — Live: target finished
    const onTargetFinished = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobTargetFinished]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobTargetFinished, onTargetFinished);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-001 — Live: job finished
    const onJobFinished = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFinished]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobFinished, onJobFinished);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-001 — Live: job failed
    const onJobFailed = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFailed]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobFailed, onJobFailed);

    // FR-JOBS-STR-001 / FR-JOBS-OWN-001 — Live: job cancelled
    const onJobCancelled = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobCancelled]) => {
        if (event.userId === userId) {
            sendSSE(res, event);
        }
    };
    req.context.emitter.on(constants.events.jobs.jobCancelled, onJobCancelled);

    req.on('close', () => {
        req.context.emitter.off(constants.events.jobs.jobsRunning, onRunningJobs);
        req.context.emitter.off(constants.events.jobs.jobsScheduled, onScheduledJobs);
        req.context.emitter.off(constants.events.jobs.jobTargetFinished, onTargetFinished);
        req.context.emitter.off(constants.events.jobs.jobFinished, onJobFinished);
        req.context.emitter.off(constants.events.jobs.jobFailed, onJobFailed);
        req.context.emitter.off(constants.events.jobs.jobCancelled, onJobCancelled);
    });
};

export {
    changeJobScheduleStatus,
    createJob,
    deleteJob,
    getAllJobs,
    getJob,
    retryJobSchedule,
    runJob,
    stopJob,
    streamJobs,
    updateJob,
};
