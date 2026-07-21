const mockLoggerError = vi.hoisted(() => vi.fn());

import { BusinessLogicException, ResourceNotFoundException } from 'aop/exceptions';

import { stopJob } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for stop-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/specification/architecture/http/jobs/stop.md
 * @see documentation/specification/architecture/http/jobs/ownership.md
 */

const mockGetById = vi.fn();
const mockCancel = vi.fn();
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
                cancel: mockCancel,
                getRunningJobsForUser: buildGetRunningJobsForUser(runningJobs),
            },
        },
    }) as unknown as Request<IdRouteParam>;

describe('jobs-controller stopJob', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockGetById.mockResolvedValue({ id: mockJobId, userId: mockUserId });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('[HTTP-JOBS-STP-001]', () => {
        it('requests cancel when the job is running for the current user', async () => {
            const mockRequest = buildRequest([{ jobId: mockJobId, userId: mockUserId }]);

            await stopJob(mockRequest, mockResponse);

            expect(mockGetById).toHaveBeenCalledWith(mockJobId, mockUserId);
            expect(mockCancel).toHaveBeenCalledWith(mockJobId);
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
    });

    describe('[HTTP-JOBS-STP-002]', () => {
        it('rejects when the job is not running', async () => {
            const mockRequest = buildRequest();

            await expect(stopJob(mockRequest, mockResponse)).rejects.toThrow(BusinessLogicException);
            await expect(stopJob(mockRequest, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_STOP_WHEN_NOT_RUNNING,
            });

            expect(mockCancel).not.toHaveBeenCalled();
        });

        it('rejects when another user job is running under the same id in memory', async () => {
            const mockRequest = buildRequest([{ jobId: mockJobId, userId: mockOtherUserId }]);

            await expect(stopJob(mockRequest, mockResponse)).rejects.toThrow(BusinessLogicException);
            await expect(stopJob(mockRequest, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_STOP_WHEN_NOT_RUNNING,
            });

            expect(mockCancel).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('propagates not-found when the job is not owned by the user', async () => {
            const mockRequest = buildRequest([{ jobId: mockJobId, userId: mockOtherUserId }]);
            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(stopJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);
            expect(mockCancel).not.toHaveBeenCalled();
        });
    });
});
