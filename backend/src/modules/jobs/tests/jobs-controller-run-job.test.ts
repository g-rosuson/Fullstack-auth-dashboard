const mockLoggerError = vi.hoisted(() => vi.fn());

import { BusinessLogicException, ResourceNotFoundException } from 'aop/exceptions';

import { runJob } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for run-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see docs/specs/architecture/http/jobs/run.md
 * @see docs/specs/architecture/http/jobs/ownership.md
 */

const mockGetById = vi.fn();
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

const mockJobId = 'job-id-1';
const mockUserId = 'user-id-1';
const mockOtherUserId = 'user-id-2';
const mockTools = [{ id: 'tool-1', type: 'scraper' }];
const now = new Date('2026-03-10T12:00:00.000Z').toISOString();

/**
 * Builds a getRunningJobsForUser mock from in-memory running entries (filters by owner).
 */
const buildGetRunningJobsForUser =
    (runningJobs: Array<{ jobId: string; userId: string }> = []) =>
    (userId: string) =>
        runningJobs.filter(job => job.userId === userId).map(({ jobId }) => ({ jobId }));

const buildRequest = (runningJobs: Array<{ jobId: string; userId: string }> = []) =>
    ({
        params: {
            id: mockJobId,
        },
        context: {
            user: { id: mockUserId },
            db: {
                repository: {
                    jobs: {
                        getById: mockGetById,
                    },
                },
            },
            delegator: {
                delegate: mockDelegate,
                getRunningJobsForUser: buildGetRunningJobsForUser(runningJobs),
            },
        },
    }) as unknown as Request<IdRouteParam>;

describe('jobs-controller runJob', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockGetById.mockResolvedValue({
            id: mockJobId,
            userId: mockUserId,
            tools: mockTools,
            schedule: null,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('[HTTP-JOBS-RUN-001]', () => {
        it('delegates when the job is not running for the current user', async () => {
            const mockRequest = buildRequest();

            await runJob(mockRequest, mockResponse);

            expect(mockGetById).toHaveBeenCalledWith(mockJobId, mockUserId);
            expect(mockDelegate).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                tools: mockTools,
                scheduleType: null,
            });
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: {
                    jobId: mockJobId,
                },
                meta: {
                    timestamp: now,
                },
            });
        });

        it('passes the persisted schedule type when the job has a schedule', async () => {
            mockGetById.mockResolvedValue({
                id: mockJobId,
                userId: mockUserId,
                tools: mockTools,
                schedule: { type: 'daily', status: 'idle' },
            });
            const mockRequest = buildRequest();

            await runJob(mockRequest, mockResponse);

            expect(mockDelegate).toHaveBeenCalledWith({
                jobId: mockJobId,
                userId: mockUserId,
                tools: mockTools,
                scheduleType: 'daily',
            });
        });
    });

    describe('[HTTP-JOBS-RUN-002]', () => {
        it('rejects when the job is already running', async () => {
            const mockRequest = buildRequest([{ jobId: mockJobId, userId: mockUserId }]);

            await expect(runJob(mockRequest, mockResponse)).rejects.toThrow(BusinessLogicException);
            await expect(runJob(mockRequest, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_RUN_WHILE_RUNNING,
            });

            expect(mockDelegate).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('propagates not-found when the job is not owned by the user', async () => {
            const mockRequest = buildRequest();
            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(runJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);
            expect(mockDelegate).not.toHaveBeenCalled();
        });

        it('does not treat another user running entry as blocking before ownership fails', async () => {
            const mockRequest = buildRequest([{ jobId: mockJobId, userId: mockOtherUserId }]);
            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(runJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);
            expect(mockDelegate).not.toHaveBeenCalled();
        });
    });
});
