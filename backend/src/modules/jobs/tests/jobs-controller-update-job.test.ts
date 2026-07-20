const mockLoggerError = vi.hoisted(() => vi.fn());

import { BusinessLogicException } from 'aop/exceptions';
import { ErrorCode } from 'aop/exceptions/shared/enums';

import { updateJob } from '../jobs-controller';

import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam, UpdateJobInput } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for update-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/jobs/update.md
 */

const mockUpdate = vi.fn();
const mockSchedule = vi.fn();
const mockGetNextAndPreviousRun = vi.fn();
const mockDelete = vi.fn();
const mockRegister = vi.fn();
const mockRemoveJob = vi.fn();
const mockDelegate = vi.fn();
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

const now = new Date('2026-03-10T12:00:00.000Z').toISOString();
const scheduledStartDate = new Date('2026-03-11T08:30:00.000Z').toISOString();
const enrichedNextRun = new Date('2026-03-18T08:30:00.000Z');

/**
 * Builds a request body for the update job function.
 */
const buildRequestBody = (): UpdateJobInput => ({
    name: 'Updated engineering jobs',
    schedule: {
        status: constants.status.idle,
        type: 'weekly' as const,
        startDate: scheduledStartDate,
        endDate: null,
    },
    tools: [
        {
            type: 'scraper' as const,
            keywords: ['typescript', 'node'],
            maxPages: 3,
            targets: [
                {
                    target: 'jobs-ch' as const,
                    keywords: ['hybrid'],
                    maxPages: 2,
                },
            ],
        },
    ],
    status: constants.status.idle,
});

/**
 * Builds a request for the update job function.
 */
const buildRequest = (
    body: UpdateJobInput,
    runningJobIds: string[] = []
): Request<IdRouteParam, unknown, UpdateJobInput> =>
    ({
        params: {
            id: 'job-id-1',
        },
        body,
        context: {
            user: { id: 'user-id-1' },
            db: {
                repository: {
                    jobs: {
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
                runningJobs: new Map(runningJobIds.map(jobId => [jobId, { payload: { userId: 'user-id-1' } }])),
                register: mockRegister,
                removeJob: mockRemoveJob,
                delegate: mockDelegate,
            },
        },
    }) as unknown as Request<IdRouteParam, unknown, UpdateJobInput>;

/**
 * Builds an updated job object.
 */
const buildUpdatedJob = (body: UpdateJobInput) => ({
    id: 'job-id-1',
    userId: 'user-id-1',
    name: body.name,
    schedule: body.schedule,
    tools: [
        { toolId: 'tool-id-1', ...body.tools[0], targets: [{ targetId: 'target-id-1', ...body.tools[0].targets[0] }] },
    ],
    createdAt: new Date('2026-03-01T12:00:00.000Z').toISOString(),
    updatedAt: now,
});

/** Expected shape of tools after real `mapToIds` (IDs are opaque strings). */
const expectMappedUpdateTools = () =>
    expect.arrayContaining([
        expect.objectContaining({
            type: 'scraper',
            toolId: expect.any(String),
            keywords: ['typescript', 'node'],
            maxPages: 3,
            targets: expect.arrayContaining([
                expect.objectContaining({
                    target: 'jobs-ch',
                    keywords: ['hybrid'],
                    maxPages: 2,
                    targetId: expect.any(String),
                }),
            ]),
        }),
    ]);

describe('jobs-controller updateJob', () => {
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

    describe('[HTTP-JOBS-UPD-001]', () => {
        it('updates a scheduled job, responds with enriched schedule, and registers it', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);

            mockUpdate.mockResolvedValue(updatedJob);

            await updateJob(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'job-id-1',
                    userId: 'user-id-1',
                    name: requestBody.name,
                    schedule: requestBody.schedule,
                    tools: expectMappedUpdateTools(),
                    updatedAt: now,
                })
            );
            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: 'job-id-1',
                userId: 'user-id-1',
                type: requestBody.schedule?.type,
                startDate: requestBody.schedule?.startDate,
                endDate: requestBody.schedule?.endDate,
            });
            expect(mockGetNextAndPreviousRun).toHaveBeenCalledWith('job-id-1');
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: updatedJob.userId,
                    name: updatedJob.name,
                    schedule: expect.objectContaining({
                        type: 'weekly',
                        status: constants.status.idle,
                        startDate: scheduledStartDate,
                        endDate: null,
                        nextRun: enrichedNextRun.toISOString(),
                        lastRun: null,
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
            expect(mockRegister).toHaveBeenCalledWith({
                jobId: 'job-id-1',
                userId: 'user-id-1',
                tools: expect.any(Array),
                scheduleType: requestBody.schedule?.type,
            });
            expect(mockDelete).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
        });

        it('rethrows when repository update fails and does not schedule or run', async () => {
            const request = buildRequest(buildRequestBody());
            const updateError = new Error('database update failed');

            mockUpdate.mockRejectedValue(updateError);

            await expect(updateJob(request, mockResponse)).rejects.toThrow(updateError);

            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockDelete).not.toHaveBeenCalled();
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-UPD-002]', () => {
        it('deletes scheduler entry and removes the job when schedule is null', async () => {
            const requestBody: UpdateJobInput = {
                ...buildRequestBody(),
                schedule: null,
                status: constants.status.idle,
            };
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);

            mockUpdate.mockResolvedValue(updatedJob);

            await updateJob(request, mockResponse);

            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockGetNextAndPreviousRun).not.toHaveBeenCalled();
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith('job-id-1');
            expect(mockRemoveJob).toHaveBeenCalledWith('job-id-1');
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    schedule: null,
                }),
                meta: {
                    timestamp: now,
                },
            });
        });

        it('keeps the saved job and returns a warning when clearing the schedule fails', async () => {
            const requestBody: UpdateJobInput = {
                ...buildRequestBody(),
                schedule: null,
                status: constants.status.idle,
            };
            const request = buildRequest(requestBody);
            const clearError = new Error('scheduler delete failed');

            mockUpdate.mockResolvedValue(buildUpdatedJob(requestBody));
            mockDelete.mockImplementationOnce(() => {
                throw clearError;
            });

            await updateJob(request, mockResponse);

            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: null,
                }),
                meta: {
                    timestamp: now,
                    warnings: [
                        {
                            code: ErrorCode.JOBS_FAILED_TO_DELEGATE_JOB,
                            message: ErrorMessage.JOBS_FAILED_TO_DELEGATE_JOB,
                        },
                    ],
                },
            });
        });
    });

    describe('[HTTP-JOBS-UPD-004]', () => {
        it('rejects update when the job is running for the current user', async () => {
            const request = buildRequest(buildRequestBody(), ['job-id-1']);

            await expect(updateJob(request, mockResponse)).rejects.toThrow(BusinessLogicException);

            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-UPD-005]', () => {
        it('keeps the saved job and returns a schedule warning when scheduling fails after save', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const schedulingError = new Error('scheduler failed');

            mockUpdate.mockResolvedValue(buildUpdatedJob(requestBody));
            mockSchedule.mockImplementation(() => {
                throw schedulingError;
            });

            await updateJob(request, mockResponse);

            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith('job-id-1');
            expect(mockRemoveJob).toHaveBeenCalledWith('job-id-1');
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    schedule: expect.objectContaining({
                        status: constants.status.idle,
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
});
