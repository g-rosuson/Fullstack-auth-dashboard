import { ScheduledTask } from 'node-cron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import constants from 'shared/constants';

import { CronJob } from './types';

import { Scheduler } from './';
import parser from 'cron-parser';

/**
 * Verification: unit proofs for scheduler runtime behavior (cite FR IDs; FRs via Traces in docs).
 * @see docs/specs/requirements/fr/jobs/schedule/schedule.md
 * @see docs/specs/requirements/fr/jobs/schedule/once.md
 * @see docs/specs/requirements/fr/jobs/execution/execution.md
 */

const invalidCronExpression = 'invalid';
const defaultCronExpression = '0 0 * * *';
const mockErrorMsg = 'Error msg';
const mockJobId = 'test-job-id';
const mockUserId = 'test-user-id';
const mockOtherUserId = 'other-user-id';
const mockDailyType = 'daily' as const;
const mockOnceType = 'once' as const;

/** Fixed local wall-clock fixtures so start/end delays are deterministic under fake timers. */
const mockNowBeforeStart = new Date(2026, 1, 12, 8, 25, 0, 0); // 2026-02-12 08:25 local
const mockStartDateLocal = new Date(2026, 1, 12, 8, 30, 0, 0); // +5 min
const mockEndDateLocal = new Date(2026, 1, 12, 8, 35, 0, 0); // +10 min from now
const mockStartDate = mockStartDateLocal.toISOString();
const mockEndDate = mockEndDateLocal.toISOString();
const mockDate = mockStartDate;
const mockTimeoutToStart = mockStartDateLocal.getTime() - mockNowBeforeStart.getTime();
const mockTimeoutToEnd = mockEndDateLocal.getTime() - mockNowBeforeStart.getTime();
const mockDailyCronExpression = `${mockStartDateLocal.getMinutes()} ${mockStartDateLocal.getHours()} * * *`;

const mockDestroy = vi.fn();
const parseMock = vi.hoisted(() => vi.fn());
const infoMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());
const delegateScheduledJobMock = vi.hoisted(() => vi.fn());
const mockStartCronTask = vi.hoisted(() => vi.fn());
const mockStopCronTask = vi.hoisted(() => vi.fn());
const emitMock = vi.hoisted(() => vi.fn());

vi.mock('aop/logging', () => ({
    logger: {
        info: infoMock,
        error: errorMock,
    },
}));

vi.mock('cron-parser', () => ({
    default: {
        parse: parseMock,
    },
}));

vi.mock('aop/delegator', () => ({
    Delegator: {
        getInstance: vi.fn(() => ({
            delegateScheduledJob: delegateScheduledJobMock,
        })),
    },
}));

vi.mock('aop/emitter', () => ({
    Emitter: {
        getInstance: vi.fn(() => ({
            emit: emitMock,
        })),
    },
}));

vi.mock('node-cron', () => ({
    default: {
        createTask: vi.fn(() => ({
            start: mockStartCronTask,
            stop: mockStopCronTask,
            destroy: mockDestroy,
        })),
        validate: vi.fn(() => true),
    },
}));

/**
 * Creates a mock cron job with default values and the given overrides.
 */
const getMockCronJob = (cronJob: Partial<CronJob> = {}): CronJob => ({
    jobId: mockJobId,
    userId: mockUserId,
    type: mockDailyType,
    status: constants.status.schedule.idle,
    cronExpression: defaultCronExpression,
    startDate: new Date(),
    endDate: new Date(),
    cronTask: {
        destroy: mockDestroy,
        start: mockStartCronTask,
        stop: mockStopCronTask,
    } as unknown as ScheduledTask,
    metadata: {
        startTimeoutId: undefined,
        stopTimeoutId: undefined,
    },
    ...cronJob,
});

/** Access private in-memory map (TypeScript `private` is compile-time only). */
const getCronJobsMap = (scheduler: Scheduler): Map<string, CronJob> =>
    // @ts-expect-error - private field accessed for unit verification
    scheduler.cronJobs;

describe('Scheduler', () => {
    let scheduler: Scheduler;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockNowBeforeStart);
        vi.clearAllMocks();
        infoMock.mockReset();
        errorMock.mockReset();
        parseMock.mockReset();
        mockDestroy.mockReset();
        delegateScheduledJobMock.mockReset();
        mockStartCronTask.mockReset();
        mockStopCronTask.mockReset();
        emitMock.mockReset();

        // @ts-expect-error - accessing private static property for testing
        Scheduler.instance = null;
        scheduler = Scheduler.getInstance();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getInstance', () => {
        it('should return the same instance on multiple calls', () => {
            const firstInstance = Scheduler.getInstance();
            const secondInstance = Scheduler.getInstance();

            expect(firstInstance).toBe(secondInstance);
        });
    });

    describe('getNextRunFromPersistedSchedule', () => {
        it('returns the next run from cron-parser using the same expression rules as schedule()', () => {
            const expected = new Date('2026-06-01T12:00:00.000Z');
            parseMock.mockImplementation(() => ({
                next: () => ({ toDate: () => expected }),
            }));

            const next = scheduler.getNextRunFromPersistedSchedule({
                type: 'daily',
                startDate: '2026-01-01T08:00:00.000Z',
                endDate: null,
            });

            expect(next).toEqual(expected);
            expect(parseMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getNextAndPreviousRun', () => {
        it('should return null for next and previous run if the cron job is not found', () => {
            expect(scheduler.getNextAndPreviousRun(mockJobId)).toEqual({
                nextRun: null,
                previousRun: null,
            });
        });

        it('should return null for next and previous run if the cron job has no cron expression', () => {
            getCronJobsMap(scheduler).set(mockJobId, getMockCronJob({ cronExpression: undefined }));

            expect(scheduler.getNextAndPreviousRun(mockJobId)).toEqual({
                nextRun: null,
                previousRun: null,
            });
        });

        it('should return nulls and log when next-run computation fails', () => {
            getCronJobsMap(scheduler).set(mockJobId, getMockCronJob({ cronExpression: invalidCronExpression }));
            parseMock.mockImplementation(() => ({
                next: () => {
                    throw new Error(mockErrorMsg);
                },
                prev: () => {
                    throw new Error(mockErrorMsg);
                },
            }));

            expect(scheduler.getNextAndPreviousRun(mockJobId)).toEqual({
                nextRun: null,
                previousRun: null,
            });
            expect(errorMock).toHaveBeenCalled();
        });

        it('should determine nextRun date when .prev() throws an error', () => {
            parseMock.mockImplementationOnce(() => ({
                next: () => ({ toDate: () => new Date(mockDate) }),
            }));
            parseMock.mockImplementationOnce(() => ({
                prev: () => {
                    throw new Error(mockErrorMsg);
                },
            }));

            getCronJobsMap(scheduler).set(mockJobId, getMockCronJob());
            const result = scheduler.getNextAndPreviousRun(mockJobId);

            expect(result.nextRun).toEqual(new Date(mockDate));
            expect(result.previousRun).toBeNull();
            expect(errorMock).not.toHaveBeenCalled();
        });

        it('should determine previousRun date when .next() throws an error', () => {
            parseMock.mockImplementationOnce(() => ({
                next: () => {
                    throw new Error(mockErrorMsg);
                },
            }));
            parseMock.mockImplementationOnce(() => ({
                prev: () => ({ toDate: () => new Date(mockDate) }),
            }));

            getCronJobsMap(scheduler).set(mockJobId, getMockCronJob());
            const result = scheduler.getNextAndPreviousRun(mockJobId);

            expect(result.nextRun).toBeNull();
            expect(result.previousRun).toEqual(new Date(mockDate));
            expect(errorMock).toHaveBeenCalled();
        });

        it('should return nulls when both next() and prev() throw', () => {
            parseMock.mockImplementation(() => ({
                next: () => {
                    throw new Error(mockErrorMsg);
                },
                prev: () => {
                    throw new Error(mockErrorMsg);
                },
            }));

            getCronJobsMap(scheduler).set(mockJobId, getMockCronJob());

            expect(scheduler.getNextAndPreviousRun(mockJobId)).toEqual({
                nextRun: null,
                previousRun: null,
            });
            expect(errorMock).toHaveBeenCalledTimes(1);
        });

        it('should handle startDate > endDate', () => {
            parseMock.mockImplementation(() => {
                throw new Error(mockErrorMsg);
            });

            getCronJobsMap(scheduler).set(
                mockJobId,
                getMockCronJob({
                    startDate: new Date('2026-02-10'),
                    endDate: new Date('2026-02-01'),
                })
            );

            expect(scheduler.getNextAndPreviousRun(mockJobId)).toEqual({
                nextRun: null,
                previousRun: null,
            });
            expect(errorMock).toHaveBeenCalled();
        });

        describe('next interval currentDate', () => {
            beforeEach(() => {
                vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));
            });

            it('should use the current time if the start date is in the past', () => {
                const now = new Date();
                const startDate = new Date(now.getTime() - 1000);
                const endDate = new Date(now.getTime() + 10000);

                getCronJobsMap(scheduler).set(mockJobId, getMockCronJob({ startDate, endDate }));
                scheduler.getNextAndPreviousRun(mockJobId);

                expect(parser.parse).toHaveBeenCalledWith(defaultCronExpression, {
                    currentDate: now,
                    endDate,
                });
            });

            it('should use one ms before start date when start is in the future', () => {
                const now = new Date();
                const startDate = new Date(now.getTime() + 1000);
                const endDate = new Date(now.getTime() + 10000);
                const expectedNextCurrentDate = new Date(Math.max(0, startDate.getTime() - 1));

                getCronJobsMap(scheduler).set(mockJobId, getMockCronJob({ startDate, endDate }));
                scheduler.getNextAndPreviousRun(mockJobId);

                expect(parser.parse).toHaveBeenCalledWith(defaultCronExpression, {
                    currentDate: expectedNextCurrentDate,
                    endDate,
                });
            });
        });

        describe('previous interval currentDate', () => {
            beforeEach(() => {
                vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));
            });

            it('should use the current time and cron job start date', () => {
                const now = new Date();
                const startDate = new Date(now.getTime() - 1000);
                const endDate = new Date(now.getTime() + 10000);

                getCronJobsMap(scheduler).set(mockJobId, getMockCronJob({ startDate, endDate }));
                scheduler.getNextAndPreviousRun(mockJobId);

                expect(parser.parse).toHaveBeenCalledWith(defaultCronExpression, {
                    currentDate: now,
                    startDate,
                });
            });
        });
    });

    describe('[FR-JOBS-SCH-003]', () => {
        it('creates a cron expression and task for daily jobs', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockDate,
                endDate: mockDate,
                type: 'daily',
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)).toEqual(
                expect.objectContaining({
                    cronTask: expect.any(Object),
                    cronExpression: mockDailyCronExpression,
                    type: 'daily',
                })
            );
        });

        it('creates a weekly cron expression from startDate weekday', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: 'weekly',
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)?.cronExpression).toBe(
                `${mockStartDateLocal.getMinutes()} ${mockStartDateLocal.getHours()} * * ${mockStartDateLocal.getDay()}`
            );
        });

        it('creates a monthly cron expression from startDate day-of-month', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: 'monthly',
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)?.cronExpression).toBe(
                `${mockStartDateLocal.getMinutes()} ${mockStartDateLocal.getHours()} ${mockStartDateLocal.getDate()} * *`
            );
        });

        it('creates a yearly cron expression from startDate calendar date', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: 'yearly',
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)?.cronExpression).toBe(
                `${mockStartDateLocal.getMinutes()} ${mockStartDateLocal.getHours()} ${mockStartDateLocal.getDate()} ${mockStartDateLocal.getMonth() + 1} *`
            );
        });

        it('does not create a cron task or expression for once jobs', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockDate,
                endDate: null,
                type: mockOnceType,
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)).toEqual(
                expect.objectContaining({
                    cronTask: undefined,
                    cronExpression: undefined,
                    type: 'once',
                })
            );
        });
    });

    describe('[FR-JOBS-SCH-004]', () => {
        it('does not catch up immediately when startDate is already in the past; only starts the cron task', () => {
            vi.setSystemTime(new Date(2026, 1, 12, 9, 0, 0, 0));

            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });

            vi.advanceTimersByTime(0);

            expect(delegateScheduledJobMock).not.toHaveBeenCalled();
            expect(mockStartCronTask).toHaveBeenCalled();
            expect(getCronJobsMap(scheduler).get(mockJobId)).toBeDefined();
        });
    });

    describe('[FR-JOBS-SCH-005]', () => {
        it('runs once at startDate then starts the cron task for recurring jobs', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: mockEndDate,
                type: mockDailyType,
            });

            vi.advanceTimersByTime(mockTimeoutToStart);

            expect(delegateScheduledJobMock).toHaveBeenCalledWith(mockJobId);
            expect(mockStartCronTask).toHaveBeenCalled();
            expect(getCronJobsMap(scheduler).get(mockJobId)).toBeDefined();
        });

        it('delegates and deletes once jobs when start timeout fires', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockOnceType,
            });

            vi.advanceTimersByTime(mockTimeoutToStart);

            expect(delegateScheduledJobMock).toHaveBeenCalledWith(mockJobId);
            expect(getCronJobsMap(scheduler).get(mockJobId)).toBeUndefined();
        });

        it('creates a start timeout for active (non-stopped) jobs', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockDate,
                endDate: mockDate,
                type: mockDailyType,
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)).toEqual(
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        startTimeoutId: expect.any(Object),
                    }),
                })
            );
        });
    });

    describe('[FR-JOBS-SCH-009]', () => {
        it('stops the cron task and sets runtime status to stopped when endDate is reached', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: mockEndDate,
                type: mockDailyType,
            });

            vi.advanceTimersByTime(mockTimeoutToEnd);

            const job = getCronJobsMap(scheduler).get(mockJobId);
            expect(mockStopCronTask).toHaveBeenCalled();
            expect(job?.status).toBe(constants.status.schedule.stopped);
        });

        it('does not create a stop timeout when endDate is null', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });

            expect(getCronJobsMap(scheduler).get(mockJobId)?.metadata.stopTimeoutId).toBeUndefined();
        });
    });

    describe('[FR-JOBS-STR-004]', () => {
        it('emits scheduled-jobs snapshot after schedule', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });

            expect(emitMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobsScheduled,
                    userId: mockUserId,
                    scheduledJobs: [
                        { jobId: mockJobId, status: constants.status.schedule.idle, nextRun: null, lastRun: null },
                    ],
                })
            );
        });

        it('emits scheduled-jobs snapshot after delete', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });
            emitMock.mockClear();

            scheduler.delete(mockJobId);

            expect(emitMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobsScheduled,
                    userId: mockUserId,
                    scheduledJobs: [],
                })
            );
        });

        it('emits scheduled-jobs snapshot when endDate stop timeout fires', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: mockEndDate,
                type: mockDailyType,
            });
            emitMock.mockClear();

            vi.advanceTimersByTime(mockTimeoutToEnd);

            expect(emitMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobsScheduled,
                    userId: mockUserId,
                    scheduledJobs: [
                        { jobId: mockJobId, status: constants.status.schedule.stopped, nextRun: null, lastRun: null },
                    ],
                })
            );
        });

        it('emits once when replacing an existing job via schedule (teardown does not emit)', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });
            emitMock.mockClear();

            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });

            expect(emitMock).toHaveBeenCalledTimes(1);
            expect(mockDestroy).toHaveBeenCalled();
        });
    });

    describe('schedule', () => {
        it('should schedule a job idempotently by replacing the prior entry', () => {
            const oldJob = getMockCronJob();
            getCronJobsMap(scheduler).set(mockJobId, oldJob);

            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockDate,
                endDate: mockDate,
                type: mockDailyType,
            });

            const newJob = getCronJobsMap(scheduler).get(mockJobId);

            expect(mockDestroy).toHaveBeenCalledTimes(1);
            expect(newJob).toBeDefined();
            expect(newJob).not.toBe(oldJob);
        });

        it('attaches a stopped job without start/stop timeouts', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: mockEndDate,
                type: mockDailyType,
                isStopped: true,
            });

            const job = getCronJobsMap(scheduler).get(mockJobId);

            expect(job).toEqual(
                expect.objectContaining({
                    status: constants.status.schedule.stopped,
                    metadata: {
                        startTimeoutId: undefined,
                        stopTimeoutId: undefined,
                    },
                })
            );
            expect(delegateScheduledJobMock).not.toHaveBeenCalled();
            expect(mockStartCronTask).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('removes the job, destroys the cron task, and clears timeouts', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: mockEndDate,
                type: mockDailyType,
            });

            scheduler.delete(mockJobId);

            expect(getCronJobsMap(scheduler).get(mockJobId)).toBeUndefined();
            expect(mockDestroy).toHaveBeenCalled();
            expect(infoMock).toHaveBeenCalledWith(`Deleted cron-job with id: "${mockJobId}"`);
        });

        it('logs and returns when the job is already absent', () => {
            scheduler.delete(mockJobId);

            expect(errorMock).toHaveBeenCalledWith(`Could not find and delete cron-job with id: "${mockJobId}"`, {});
            expect(emitMock).not.toHaveBeenCalled();
        });
    });

    describe('getCronJobEventsForUser', () => {
        it('returns scheduled job events only for the given user with next and last run', () => {
            const nextRun = new Date('2026-03-12T08:30:00.000Z');
            const previousRun = new Date('2026-03-11T08:30:00.000Z');

            parseMock.mockImplementation(() => ({
                next: () => ({ toDate: () => nextRun }),
                prev: () => ({ toDate: () => previousRun }),
            }));

            getCronJobsMap(scheduler).set(
                mockJobId,
                getMockCronJob({ jobId: mockJobId, userId: mockUserId, status: constants.status.schedule.idle })
            );
            getCronJobsMap(scheduler).set(
                'job-2',
                getMockCronJob({
                    jobId: 'job-2',
                    userId: mockOtherUserId,
                    status: constants.status.schedule.stopped,
                })
            );
            getCronJobsMap(scheduler).set(
                'job-3',
                getMockCronJob({ jobId: 'job-3', userId: mockUserId, status: constants.status.schedule.idle })
            );

            expect(scheduler.getCronJobEventsForUser(mockUserId)).toEqual([
                {
                    jobId: mockJobId,
                    status: constants.status.schedule.idle,
                    nextRun: nextRun.toISOString(),
                    lastRun: previousRun.toISOString(),
                },
                {
                    jobId: 'job-3',
                    status: constants.status.schedule.idle,
                    nextRun: nextRun.toISOString(),
                    lastRun: previousRun.toISOString(),
                },
            ]);
            expect(scheduler.getCronJobEventsForUser(mockOtherUserId)).toEqual([
                {
                    jobId: 'job-2',
                    status: constants.status.schedule.stopped,
                    nextRun: nextRun.toISOString(),
                    lastRun: previousRun.toISOString(),
                },
            ]);
            expect(scheduler.getCronJobEventsForUser('nobody')).toEqual([]);
        });
    });

    describe('getAllJobs', () => {
        it('returns an immutable snapshot of jobs currently in memory', () => {
            scheduler.schedule({
                jobId: mockJobId,
                userId: mockUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
            });
            scheduler.schedule({
                jobId: 'job-2',
                userId: mockOtherUserId,
                startDate: mockStartDate,
                endDate: null,
                type: mockDailyType,
                isStopped: true,
            });

            const jobs = scheduler.getAllJobs();

            expect(jobs).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        jobId: mockJobId,
                        userId: mockUserId,
                        status: constants.status.schedule.idle,
                    }),
                    expect.objectContaining({
                        jobId: 'job-2',
                        userId: mockOtherUserId,
                        status: constants.status.schedule.stopped,
                    }),
                ])
            );

            const first = jobs[0];
            // @ts-expect-error - prove snapshot is a copy
            first.metadata.startTimeoutId = 'mutated';
            expect(getCronJobsMap(scheduler).get(first.jobId)?.metadata.startTimeoutId).not.toBe('mutated');
        });
    });
});
