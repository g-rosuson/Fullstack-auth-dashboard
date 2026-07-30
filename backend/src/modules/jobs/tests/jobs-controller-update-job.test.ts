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
 * @see docs/specs/architecture/http/jobs/update.md
 */

const mockUpdate = vi.fn();
const mockSchedule = vi.fn();
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

/**
 * Builds a request body for the update job function.
 */
const buildRequestBody = (): UpdateJobInput => ({
    name: 'Updated engineering jobs',
    schedule: {
        status: constants.status.schedule.idle,
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
            },
            delegator: {
                getRunningJobsForUser: () => runningJobIds.map(jobId => ({ jobId })),
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
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('[HTTP-JOBS-UPD-001]', () => {
        it('updates a scheduled job, responds with the persisted schedule, and registers it', async () => {
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
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: 'user-id-1',
                    schedule: expect.objectContaining({
                        status: constants.status.schedule.idle,
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
            expect(mockRegister).toHaveBeenCalledWith({
                jobId: 'job-id-1',
                userId: 'user-id-1',
                tools: updatedJob.tools,
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
            expect(mockLoggerError).toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-UPD-002]', () => {
        it('clears the schedule, deletes scheduler entry, and removes the job', async () => {
            const requestBody: UpdateJobInput = {
                ...buildRequestBody(),
                schedule: null,
            };
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);

            mockUpdate.mockResolvedValue(updatedJob);

            await updateJob(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'job-id-1',
                    userId: 'user-id-1',
                    schedule: null,
                })
            );
            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith('job-id-1');
            expect(mockRemoveJob).toHaveBeenCalledWith('job-id-1');
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: 'user-id-1',
                    schedule: null,
                }),
                meta: {
                    timestamp: now,
                },
            });
        });
    });

    describe('[HTTP-JOBS-UPD-003]', () => {
        it('updates with stopped schedule, attaches runtime stopped, and registers it', async () => {
            const baseBody = buildRequestBody();
            const requestBody: UpdateJobInput = {
                ...baseBody,
                schedule: {
                    ...baseBody.schedule!,
                    status: constants.status.schedule.stopped,
                },
            };
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);

            mockUpdate.mockResolvedValue(updatedJob);

            await updateJob(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'job-id-1',
                    userId: 'user-id-1',
                    schedule: requestBody.schedule,
                })
            );
            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: 'job-id-1',
                userId: 'user-id-1',
                type: requestBody.schedule?.type,
                startDate: requestBody.schedule?.startDate,
                endDate: requestBody.schedule?.endDate,
                isStopped: true,
            });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: 'user-id-1',
                    schedule: expect.objectContaining({
                        status: constants.status.schedule.stopped,
                    }),
                }),
                meta: {
                    timestamp: now,
                },
            });
            expect(mockRegister).toHaveBeenCalledWith({
                jobId: 'job-id-1',
                userId: 'user-id-1',
                tools: updatedJob.tools,
                scheduleType: requestBody.schedule?.type,
            });
            expect(mockDelegate).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-UPD-004]', () => {
        it('rejects update when the job is running for the current user', async () => {
            const request = buildRequest(buildRequestBody(), ['job-id-1']);

            await expect(updateJob(request, mockResponse)).rejects.toThrow(BusinessLogicException);

            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-UPD-005]', () => {
        it('keeps the saved job and returns a schedule warning when scheduling fails after save', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);
            const schedulingError = new Error('scheduler failed');

            mockUpdate.mockResolvedValue(updatedJob);
            mockSchedule.mockImplementation(() => {
                throw schedulingError;
            });

            await updateJob(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-id-1',
                    schedule: requestBody.schedule,
                })
            );
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith('job-id-1');
            expect(mockRemoveJob).toHaveBeenCalledWith('job-id-1');
            expect(mockLoggerError).toHaveBeenCalled();
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: 'user-id-1',
                    schedule: requestBody.schedule,
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

        it('keeps the saved job and returns a warning when clearing the schedule fails', async () => {
            const requestBody: UpdateJobInput = {
                ...buildRequestBody(),
                schedule: null,
            };
            const request = buildRequest(requestBody);
            const updatedJob = buildUpdatedJob(requestBody);
            const clearError = new Error('scheduler delete failed');

            mockUpdate.mockResolvedValue(updatedJob);
            mockDelete.mockImplementationOnce(() => {
                throw clearError;
            });

            await updateJob(request, mockResponse);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-id-1',
                    schedule: null,
                })
            );
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockRemoveJob).toHaveBeenCalledWith('job-id-1');
            expect(mockLoggerError).toHaveBeenCalled();
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: updatedJob.id,
                    userId: 'user-id-1',
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
});
