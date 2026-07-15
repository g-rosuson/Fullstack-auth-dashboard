const mockLoggerError = vi.hoisted(() => vi.fn());

import { ResourceNotFoundException } from 'aop/exceptions';

import { changeJobScheduleStatus } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { ChangeCronJobStatusPayload, IdRouteParam } from '../types';
import type { Request, Response } from 'express';
import type { Job } from 'shared/types/jobs';

/**
 * Verification: unit proofs for change-schedule-status HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/jobs/schedule-status.md
 * @see documentation/architecture/http/jobs/ownership.md
 */

const mockGetById = vi.fn();
const mockUpdate = vi.fn();
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
 * Builds a persisted job returned by repository.getById for changeJobScheduleStatus tests.
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
 * Builds a request for the changeJobScheduleStatus function.
 */
const buildRequest = (
    body: ChangeCronJobStatusPayload,
    options?: {
        jobId?: string;
        userId?: string;
        runningJobs?: Map<string, { userId: string }>;
    }
): Request<IdRouteParam, unknown, ChangeCronJobStatusPayload> =>
    ({
        params: {
            id: options?.jobId ?? mockJobId,
        },
        body,
        context: {
            user: { id: options?.userId ?? mockUserId },
            db: {
                repository: {
                    jobs: {
                        getById: mockGetById,
                        update: mockUpdate,
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
    }) as unknown as Request<IdRouteParam, unknown, ChangeCronJobStatusPayload>;

describe('jobs-controller changeJobScheduleStatus', () => {
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

    describe('[HTTP-JOBS-SSC-001]', () => {
        it('loads the job scoped to the authenticated owner', async () => {
            const persistedJob = buildPersistedJob();
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'stopped' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockGetById).toHaveBeenCalledWith(mockJobId, mockUserId);
        });

        it('rethrows when the repository update fails', async () => {
            const persistedJob = buildPersistedJob();
            const request = buildRequest({ status: 'stopped' });
            const updateError = new Error('database update failed');

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockRejectedValue(updateError);

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toThrow(updateError);

            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
        });

        it('updates only schedule.status and leaves other job fields unchanged', async () => {
            const persistedJob = buildPersistedJob();
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'stopped' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: mockJobId,
                    userId: mockUserId,
                    name: persistedJob.name,
                    tools: persistedJob.tools,
                    schedule: expect.objectContaining({
                        type: persistedJob.schedule!.type,
                        startDate: persistedJob.schedule!.startDate,
                        endDate: persistedJob.schedule!.endDate,
                        status: 'stopped',
                    }),
                })
            );
        });

        it('stops an idle scheduled job and responds with schedule.status stopped', async () => {
            const persistedJob = buildPersistedJob();
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'stopped' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: persistedJob.schedule!.type,
                startDate: persistedJob.schedule!.startDate,
                endDate: persistedJob.schedule!.endDate,
                isStopped: true,
            });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'stopped',
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
        });

        it('returns null nextRun and lastRun when stopping a schedule', async () => {
            const persistedJob = buildPersistedJob();
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'stopped' },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'stopped',
                        nextRun: null,
                        lastRun: null,
                    }),
                }),
                meta: expect.objectContaining({
                    timestamp: now,
                }),
            });
        });
    });

    describe('[HTTP-JOBS-SSC-002]', () => {
        it('reactivates a stopped scheduled job and responds with schedule.status idle', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: futureStartDate,
                    endDate: null,
                    status: 'stopped',
                },
            });
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'idle' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'idle' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: 'daily',
                startDate: futureStartDate,
                endDate: null,
            });
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: 'idle',
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
        });

        it('passes the persisted past startDate when re-enabling to idle', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: pastStartDate,
                    endDate: null,
                    status: 'stopped',
                },
            });
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'idle' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'idle' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: 'daily',
                startDate: pastStartDate,
                endDate: null,
            });
        });

        it('passes the persisted future startDate when re-enabling to idle', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: futureStartDate,
                    endDate: null,
                    status: 'stopped',
                },
            });
            const updatedJob = {
                ...persistedJob,
                schedule: { ...persistedJob.schedule!, status: 'idle' as const },
                updatedAt: now,
            };
            const request = buildRequest({ status: 'idle' });

            mockGetById.mockResolvedValue(persistedJob);
            mockUpdate.mockResolvedValue(updatedJob);

            await changeJobScheduleStatus(request, mockResponse);

            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                type: 'daily',
                startDate: futureStartDate,
                endDate: null,
            });
        });
    });

    describe('[HTTP-JOBS-SSC-003]', () => {
        it('rejects when the requested status matches the current status', async () => {
            const persistedJob = buildPersistedJob();
            const request = buildRequest({ status: 'idle' });

            mockGetById.mockResolvedValue(persistedJob);

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_TO_EXISTING_STATUS,
            });

            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-SSC-004]', () => {
        it('rejects when the job has no schedule', async () => {
            const persistedJob = buildPersistedJob({ schedule: null });
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockResolvedValue(persistedJob);

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WITHOUT_SCHEDULE,
            });

            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-SSC-005]', () => {
        it('rejects when the job is running for the current user', async () => {
            const request = buildRequest(
                { status: 'stopped' },
                { runningJobs: new Map([[mockJobId, { userId: mockUserId }]]) }
            );

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WHILE_RUNNING,
            });

            expect(mockGetById).not.toHaveBeenCalled();
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalledWith('Failed to change job schedule status', {
                error: expect.objectContaining({
                    message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_WHILE_RUNNING,
                }),
            });
        });
    });

    describe('[HTTP-JOBS-SSC-006]', () => {
        it('rejects when re-enabling to idle and endDate is in the past', async () => {
            const persistedJob = buildPersistedJob({
                schedule: {
                    type: 'daily',
                    startDate: pastStartDate,
                    endDate: expiredEndDate,
                    status: 'stopped',
                },
            });
            const request = buildRequest({ status: 'idle' });

            mockGetById.mockResolvedValue(persistedJob);

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_CHANGE_STATUS_OF_EXPIRED_SCHEDULE,
            });

            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('rejects when the job is owned by another user', async () => {
            const request = buildRequest({ status: 'stopped' });

            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toThrow(ResourceNotFoundException);

            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
        });

        it('rejects when the job id does not exist', async () => {
            const request = buildRequest({ status: 'stopped' }, { jobId: 'missing-job-id' });

            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(changeJobScheduleStatus(request, mockResponse)).rejects.toThrow(ResourceNotFoundException);

            expect(mockGetById).toHaveBeenCalledWith('missing-job-id', mockUserId);
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });
});
