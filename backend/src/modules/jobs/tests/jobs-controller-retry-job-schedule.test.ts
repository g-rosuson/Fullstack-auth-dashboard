const mockLoggerError = vi.hoisted(() => vi.fn());

import { ResourceNotFoundException } from 'aop/exceptions';
import { ErrorCode } from 'aop/exceptions/shared/enums';

import { retryJobSchedule } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';
import type { Job } from 'shared/types/jobs';

/**
 * Verification: unit proofs for retry-schedule HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/jobs/retry-schedule.md
 * @see documentation/architecture/http/jobs/ownership.md
 */

const mockGetById = vi.fn();
const mockSchedule = vi.fn();
const mockDelete = vi.fn();
const mockRegister = vi.fn();
const mockRemoveJob = vi.fn();
const mockGetNextAndPreviousRun = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();

vi.mock('aop/logging', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: mockLoggerError,
    },
}));

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
} as unknown as Response;

const mockJobId = 'job-id-1';
const mockUserId = 'user-id-1';
const now = new Date('2026-03-10T12:00:00.000Z').toISOString();
const pastStartDate = new Date('2026-03-01T08:30:00.000Z').toISOString();
const futureStartDate = new Date('2026-03-11T08:30:00.000Z').toISOString();
const expiredEndDate = new Date('2026-03-09T12:00:00.000Z').toISOString();
const enrichedNextRun = new Date('2026-03-12T08:30:00.000Z');

/**
 * Builds a persisted job returned by repository.getById for retryJobSchedule tests.
 */
const buildPersistedJob = (overrides?: Partial<Job>): Job => ({
    id: mockJobId,
    userId: mockUserId,
    name: 'Daily engineering jobs',
    schedule: {
        type: 'daily',
        startDate: futureStartDate,
        endDate: null,
        status: 'idle',
    },
    tools: [
        {
            toolId: 'tool-id-1',
            type: 'scraper',
            keywords: ['typescript'],
            maxPages: 5,
            targets: [
                {
                    targetId: 'target-id-1',
                    target: 'jobs-ch',
                    keywords: ['remote'],
                    maxPages: 2,
                },
            ],
        },
    ],
    createdAt: new Date('2026-03-01T12:00:00.000Z').toISOString(),
    updatedAt: null,
    ...overrides,
});

/**
 * Builds a request for the retryJobSchedule function.
 */
const buildRequest = (options?: {
    jobId?: string;
    userId?: string;
    runningJobs?: Map<string, { userId: string }>;
}): Request<IdRouteParam> =>
    ({
        params: {
            id: options?.jobId ?? mockJobId,
        },
        context: {
            user: { id: options?.userId ?? mockUserId },
            db: {
                repository: {
                    jobs: {
                        getById: mockGetById,
                    },
                },
            },
            scheduler: {
                schedule: mockSchedule,
                delete: mockDelete,
                getNextAndPreviousRun: mockGetNextAndPreviousRun,
            },
            delegator: {
                runningJobs: options?.runningJobs ?? new Map(),
                register: mockRegister,
                removeJob: mockRemoveJob,
            },
        },
    }) as unknown as Request<IdRouteParam>;

describe('jobs-controller retryJobSchedule', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockGetNextAndPreviousRun.mockReturnValue({
            nextRun: enrichedNextRun,
            previousRun: null,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('[HTTP-JOBS-RTY-001]', () => {
        it('returns 200 with idle schedule reattached and persisted status unchanged', async () => {
            const persistedJob = buildPersistedJob();
            const request = buildRequest();

            mockGetById.mockResolvedValue(persistedJob);

            await retryJobSchedule(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: 'daily',
                startDate: futureStartDate,
                endDate: null,
            });
            expect(mockRegister).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                tools: persistedJob.tools,
                scheduleType: 'daily',
            });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'idle',
                        nextRun: enrichedNextRun.toISOString(),
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
        });
    });

    describe('[HTTP-JOBS-RTY-002]', () => {
        it('returns 200 with stopped schedule reattached via isStopped', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: futureStartDate,
                    endDate: null,
                    status: 'stopped',
                },
            });
            const request = buildRequest();

            mockGetById.mockResolvedValue(persistedJob);

            await retryJobSchedule(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: 'daily',
                startDate: futureStartDate,
                endDate: null,
                isStopped: true,
            });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'stopped',
                        nextRun: null,
                        lastRun: null,
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
        });
    });

    describe('[HTTP-JOBS-RTY-003]', () => {
        it('returns 200 with intent kept, runtime wiped, and meta.warnings', async () => {
            const persistedJob = buildPersistedJob();
            const request = buildRequest();
            const scheduleError = new Error('scheduler failed');

            mockGetById.mockResolvedValue(persistedJob);
            mockSchedule.mockImplementation(() => {
                throw scheduleError;
            });

            await retryJobSchedule(request, mockResponse);

            expect(mockDelete).toHaveBeenCalledWith(mockJobId);
            expect(mockRemoveJob).toHaveBeenCalledWith(mockJobId);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'idle',
                        nextRun: null,
                        lastRun: null,
                    }),
                }),
                meta: {
                    timestamp: now,
                    warnings: [
                        {
                            code: ErrorCode.JOBS_FAILED_TO_SCHEDULE_JOB,
                            message: ErrorMessage.JOBS_FAILED_TO_SCHEDULE_JOB,
                        },
                    ],
                },
            });
        });
    });

    describe('[HTTP-JOBS-RTY-004]', () => {
        it('rejects with BUSINESS_LOGIC_ERROR when the job has no schedule', async () => {
            const persistedJob = buildPersistedJob({ schedule: null });
            const request = buildRequest();

            mockGetById.mockResolvedValue(persistedJob);

            await expect(retryJobSchedule(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WITHOUT_SCHEDULE,
                statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
                errorType: ErrorCode.BUSINESS_LOGIC_ERROR,
            });
            expect(mockSchedule).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-RTY-005]', () => {
        it('rejects with BUSINESS_LOGIC_ERROR while the job is running', async () => {
            const request = buildRequest({
                runningJobs: new Map([[mockJobId, { userId: mockUserId }]]),
            });

            await expect(retryJobSchedule(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_RETRY_SCHEDULE_WHILE_RUNNING,
                statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
                errorType: ErrorCode.BUSINESS_LOGIC_ERROR,
            });
            expect(mockGetById).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-RTY-006]', () => {
        it('rejects with BUSINESS_LOGIC_ERROR when recurring endDate is past', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: pastStartDate,
                    endDate: expiredEndDate,
                    status: 'idle',
                },
            });
            const request = buildRequest();

            mockGetById.mockResolvedValue(persistedJob);

            await expect(retryJobSchedule(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_OF_EXPIRED_SCHEDULE,
                statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
                errorType: ErrorCode.BUSINESS_LOGIC_ERROR,
            });
            expect(mockSchedule).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-RTY-007]', () => {
        it('rejects with BUSINESS_LOGIC_ERROR when once startDate is past', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'once',
                    startDate: pastStartDate,
                    endDate: null,
                    status: 'idle',
                },
            });
            const request = buildRequest();

            mockGetById.mockResolvedValue(persistedJob);

            await expect(retryJobSchedule(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_ACTIVATE_ONCE_SCHEDULE_WITH_PAST_START_DATE,
                statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
                errorType: ErrorCode.BUSINESS_LOGIC_ERROR,
            });
            expect(mockSchedule).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('rejects with NOT_FOUND_ERROR when the job is not found / not owned', async () => {
            const request = buildRequest();

            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(retryJobSchedule(request, mockResponse)).rejects.toMatchObject({
                statusCode: HttpStatusCode.NOT_FOUND,
                errorType: ErrorCode.NOT_FOUND_ERROR,
            });
            expect(mockSchedule).not.toHaveBeenCalled();
        });
    });
});
