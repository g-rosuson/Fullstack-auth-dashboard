const mockLoggerError = vi.hoisted(() => vi.fn());

import { BusinessLogicException, ResourceNotFoundException } from 'aop/exceptions';

import { deleteJob } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for delete-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/jobs/delete.md
 * @see documentation/architecture/http/jobs/ownership.md
 */

const mockDelete = vi.fn();
const mockSchedulerDelete = vi.fn();
const mockDelegatorRemoveJob = vi.fn();
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
 * Builds a request for the delete job function.
 */
const buildRequest = (runningJobs: Map<string, { payload: { userId: string } }> = new Map()) =>
    ({
        params: {
            id: mockJobId,
        },
        context: {
            user: { id: mockUserId },
            db: {
                repository: {
                    jobs: {
                        delete: mockDelete,
                    },
                },
            },
            scheduler: {
                delete: mockSchedulerDelete,
            },
            delegator: {
                removeJob: mockDelegatorRemoveJob,
                runningJobs,
            },
        },
    }) as unknown as Request<IdRouteParam>;

describe('jobs-controller deleteJob', () => {
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

    describe('[HTTP-JOBS-DEL-001]', () => {
        it('should delete a job, tear down in-memory state, and respond with the deleted payload', async () => {
            const mockRequest = buildRequest();
            const deleteResult = {
                id: mockJobId,
            };

            mockDelete.mockResolvedValue(deleteResult);

            await deleteJob(mockRequest, mockResponse);

            expect(mockDelete).toHaveBeenCalledWith(mockJobId, mockUserId);
            expect(mockSchedulerDelete).toHaveBeenCalledWith(mockJobId);
            expect(mockDelegatorRemoveJob).toHaveBeenCalledWith(mockJobId);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: { id: mockJobId },
                meta: {
                    timestamp: now,
                },
            });
        });

        it('should not tear down in-memory state when the database delete fails', async () => {
            const mockRequest = buildRequest();

            mockDelete.mockRejectedValue(new Error('not found'));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow('not found');

            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalledWith('Failed to delete job', {
                error: expect.any(Error),
            });
        });
    });

    describe('[HTTP-JOBS-DEL-002]', () => {
        it('should reject delete when the job is running for the current user', async () => {
            const mockRequest = buildRequest(new Map([[mockJobId, { payload: { userId: mockUserId } }]]));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow(BusinessLogicException);
            await expect(deleteJob(mockRequest, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_BE_DELETED_WHILE_RUNNING,
            });

            expect(mockDelete).not.toHaveBeenCalled();
            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('should reach the database delete when another user job is running in memory', async () => {
            const mockRequest = buildRequest(new Map([[mockJobId, { payload: { userId: mockOtherUserId } }]]));

            mockDelete.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);

            expect(mockDelete).toHaveBeenCalledWith(mockJobId, mockUserId);
            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
        });
    });
});
