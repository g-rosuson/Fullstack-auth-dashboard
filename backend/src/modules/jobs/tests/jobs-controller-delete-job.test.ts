const mockLoggerError = vi.hoisted(() => vi.fn());

import { BusinessLogicException, ResourceNotFoundException } from 'aop/exceptions';

import { deleteJob } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';

/**
 * Mocks for the delete job function.
 */
const mockDelete = vi.fn();
const mockSchedulerDelete = vi.fn();
const mockDelegatorRemoveJob = vi.fn();
const mockStartTransaction = vi.fn();
const mockCommitTransaction = vi.fn();
const mockAbortTransaction = vi.fn();
const mockEndSession = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();

const mockSession = {
    startTransaction: mockStartTransaction,
    commitTransaction: mockCommitTransaction,
    abortTransaction: mockAbortTransaction,
    endSession: mockEndSession,
};
const mockStartSession = vi.fn(() => mockSession);

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

/**
 * Builds a request for the delete job function.
 * @returns The request
 */
const buildRequest = (runningJobs: Map<string, { userId: string }> = new Map()) =>
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
                transaction: {
                    startSession: mockStartSession,
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

describe('jobs-controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResponseStatus.mockReturnValue(mockResponse);
        mockCommitTransaction.mockResolvedValue(undefined);
        mockAbortTransaction.mockResolvedValue(undefined);
        mockEndSession.mockResolvedValue(undefined);
    });

    describe('deleteJob', () => {
        it('should delete a job, tear down in-memory state after commit, and respond with the deleted payload', async () => {
            const mockRequest = buildRequest();
            const deleteResult = {
                id: mockJobId,
            };

            mockDelete.mockResolvedValue(deleteResult);

            await deleteJob(mockRequest, mockResponse);

            expect(mockStartSession).toHaveBeenCalled();
            expect(mockStartTransaction).toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledWith(mockJobId, mockUserId, mockSession);
            expect(mockCommitTransaction).toHaveBeenCalled();
            expect(mockSchedulerDelete).toHaveBeenCalledWith(mockJobId);
            expect(mockDelegatorRemoveJob).toHaveBeenCalledWith(mockJobId);
            expect(mockAbortTransaction).not.toHaveBeenCalled();
            expect(mockEndSession).toHaveBeenCalled();
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: { id: mockJobId },
            });
        });

        it('should not tear down in-memory state when the database delete fails', async () => {
            const mockRequest = buildRequest();

            mockDelete.mockRejectedValue(new Error('not found'));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow('not found');

            expect(mockCommitTransaction).not.toHaveBeenCalled();
            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
            expect(mockAbortTransaction).toHaveBeenCalled();
            expect(mockEndSession).toHaveBeenCalled();
        });

        it('should reject delete when the job is running for the current user', async () => {
            const mockRequest = buildRequest(new Map([[mockJobId, { userId: mockUserId }]]));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow(BusinessLogicException);
            await expect(deleteJob(mockRequest, mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.JOBS_CANNOT_BE_DELETED_WHILE_RUNNING,
            });

            expect(mockStartSession).not.toHaveBeenCalled();
            expect(mockDelete).not.toHaveBeenCalled();
            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
        });

        it('should reach the database delete when another user job is running in memory', async () => {
            const mockRequest = buildRequest(new Map([[mockJobId, { userId: mockOtherUserId }]]));

            mockDelete.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(deleteJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);

            expect(mockDelete).toHaveBeenCalledWith(mockJobId, mockUserId, mockSession);
            expect(mockSchedulerDelete).not.toHaveBeenCalled();
            expect(mockDelegatorRemoveJob).not.toHaveBeenCalled();
        });
    });
});
