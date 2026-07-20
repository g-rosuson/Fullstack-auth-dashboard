const mockLoggerError = vi.hoisted(() => vi.fn());

import { ErrorCode } from 'aop/exceptions/shared/enums';

import { createJob } from '../jobs-controller';

import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { CreateJobInput } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for create-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/jobs/create.md
 */

const mockCreate = vi.fn();
const mockSchedule = vi.fn();
const mockDelete = vi.fn();
const mockGetNextAndPreviousRun = vi.fn();
const mockRegister = vi.fn();
const mockRemoveJob = vi.fn();
const mockDelegate = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
} as unknown as Response;

const now = new Date('2026-03-10T12:00:00.000Z').toISOString();
const scheduledStartDate = new Date('2026-03-11T08:30:00.000Z').toISOString();
const enrichedNextRun = new Date('2026-03-12T08:30:00.000Z');

/**
 * Builds a request body for the create job function.
 */
const buildRequestBody = (): CreateJobInput => ({
    name: 'Daily engineering jobs',
    schedule: {
        status: constants.status.idle,
        type: 'daily' as const,
        startDate: scheduledStartDate,
        endDate: null,
    },
    tools: [
        {
            type: 'scraper' as const,
            keywords: ['typescript', 'backend'],
            maxPages: 5,
            targets: [
                {
                    target: 'jobs-ch' as const,
                    keywords: ['remote'],
                    maxPages: 2,
                },
            ],
        },
    ],
});

/**
 * Builds a request for the create job function.
 */
const buildRequest = (body: CreateJobInput): Request =>
    ({
        body,
        context: {
            user: { id: 'user-id-1' },
            db: {
                repository: {
                    jobs: {
                        create: mockCreate,
                    },
                },
            },
            scheduler: {
                schedule: mockSchedule,
                delete: mockDelete,
                getNextAndPreviousRun: mockGetNextAndPreviousRun,
            },
            delegator: {
                register: mockRegister,
                removeJob: mockRemoveJob,
                delegate: mockDelegate,
            },
        },
    }) as unknown as Request;

vi.mock('aop/logging', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: mockLoggerError,
    },
}));

const buildCreatedJob = (body: CreateJobInput, scheduleOverride?: CreateJobInput['schedule']) => ({
    id: 'job-id-1',
    userId: 'user-id-1',
    name: body.name,
    schedule: typeof scheduleOverride === 'undefined' ? body.schedule : scheduleOverride,
    tools: [{ toolId: 'tool-1', ...body.tools[0], targets: [{ targetId: 'target-1', ...body.tools[0].targets[0] }] }],
    createdAt: now,
    updatedAt: null,
});

/** Expected shape of tools after real `mapToIds` (IDs are opaque strings). */
const expectMappedCreateTools = () =>
    expect.arrayContaining([
        expect.objectContaining({
            type: 'scraper',
            toolId: expect.any(String),
            keywords: ['typescript', 'backend'],
            maxPages: 5,
            targets: expect.arrayContaining([
                expect.objectContaining({
                    target: 'jobs-ch',
                    keywords: ['remote'],
                    maxPages: 2,
                    targetId: expect.any(String),
                }),
            ]),
        }),
    ]);

describe('jobs-controller createJob', () => {
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

    describe('[HTTP-JOBS-CRT-001]', () => {
        it('creates an unscheduled job and delegates it immediately', async () => {
            const requestBody: CreateJobInput = { ...buildRequestBody(), schedule: null };
            const request = buildRequest(requestBody);
            const createdJob = buildCreatedJob(requestBody, null);

            mockCreate.mockResolvedValue(createdJob);

            await createJob(request, mockResponse);

            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockGetNextAndPreviousRun).not.toHaveBeenCalled();
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: createdJob.id,
                    schedule: null,
                }),
                meta: {
                    timestamp: now,
                },
            });
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).toHaveBeenCalledWith({
                jobId: createdJob.id,
                userId: 'user-id-1',
                tools: createdJob.tools,
                scheduleType: null,
            });
        });
    });

    describe('[HTTP-JOBS-CRT-002]', () => {
        it('creates a scheduled job, responds with enriched schedule, and registers it', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const createdJob = buildCreatedJob(requestBody);

            mockCreate.mockResolvedValue(createdJob);

            await createJob(request, mockResponse);

            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-id-1',
                    name: requestBody.name,
                    schedule: requestBody.schedule,
                    tools: expectMappedCreateTools(),
                    createdAt: now,
                    updatedAt: null,
                })
            );
            expect(mockSchedule).toHaveBeenCalledWith({
                jobId: createdJob.id,
                userId: 'user-id-1',
                type: createdJob.schedule?.type,
                startDate: createdJob.schedule?.startDate,
                endDate: createdJob.schedule?.endDate,
            });
            expect(mockGetNextAndPreviousRun).toHaveBeenCalledWith(createdJob.id);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: createdJob.id,
                    userId: createdJob.userId,
                    name: createdJob.name,
                    schedule: expect.objectContaining({
                        type: 'daily',
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
                jobId: createdJob.id,
                userId: 'user-id-1',
                tools: createdJob.tools,
                scheduleType: createdJob.schedule?.type,
            });
            expect(mockDelegate).not.toHaveBeenCalled();
        });

        it('rethrows when repository create fails and does not schedule or run', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const dbError = new Error('database create failed');

            mockCreate.mockRejectedValue(dbError);

            await expect(createJob(request, mockResponse)).rejects.toThrow(dbError);

            expect(mockSchedule).not.toHaveBeenCalled();
            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockResponseStatus).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalledWith('Failed to create job', { error: dbError });
        });
    });

    describe('[HTTP-JOBS-CRT-004]', () => {
        it('keeps the saved job and returns a schedule warning when scheduling fails after save', async () => {
            const requestBody = buildRequestBody();
            const request = buildRequest(requestBody);
            const createdJob = buildCreatedJob(requestBody);
            const schedulingError = new Error('scheduler failed');

            mockCreate.mockResolvedValue(createdJob);
            mockSchedule.mockImplementation(() => {
                throw schedulingError;
            });

            await createJob(request, mockResponse);

            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockDelegate).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith(createdJob.id);
            expect(mockRemoveJob).toHaveBeenCalledWith(createdJob.id);
            expect(mockLoggerError).toHaveBeenCalledWith('Failed to schedule job', { error: schedulingError });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: createdJob.id,
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
