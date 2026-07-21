import { ResourceNotFoundException } from 'aop/exceptions';

import { getJob } from '../jobs-controller';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { IdRouteParam } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for get-job HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/specification/architecture/http/jobs/read.md
 * @see documentation/specification/architecture/http/jobs/ownership.md
 */

/**
 * Mocks for the get job function.
 */
const mockGetById = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
} as unknown as Response;

/**
 * Builds a request for the get job function.
 * @returns The request
 */
const buildRequest = () =>
    ({
        params: {
            id: 'job-id-1',
        },
        context: {
            user: { id: 'user-id-1' },
            db: {
                repository: {
                    jobs: {
                        getById: mockGetById,
                    },
                },
            },
        },
    }) as unknown as Request<IdRouteParam>;

describe('jobs-controller getJob', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResponseStatus.mockReturnValue(mockResponse);
    });

    describe('[HTTP-JOBS-GET-001]', () => {
        it('should fetch a job by id and respond with the job', async () => {
            const mockRequest = buildRequest();
            const job = {
                id: 'job-id-1',
                userId: 'user-id-1',
                name: 'Backend jobs',
                schedule: null,
                tools: [],
            };

            mockGetById.mockResolvedValue(job);

            await getJob(mockRequest, mockResponse);

            expect(mockGetById).toHaveBeenCalledWith('job-id-1', 'user-id-1');
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: job,
                meta: {
                    timestamp: expect.any(String),
                },
            });
        });

        it('should return the persisted schedule', async () => {
            const mockRequest = buildRequest();
            const job = {
                id: 'job-id-1',
                userId: 'user-id-1',
                name: 'Backend jobs',
                schedule: {
                    type: 'daily',
                    startDate: '2026-04-18T08:30:00.000Z',
                    endDate: null,
                    status: 'idle',
                },
                tools: [],
            };

            mockGetById.mockResolvedValue(job);

            await getJob(mockRequest, mockResponse);

            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: job,
                meta: {
                    timestamp: expect.any(String),
                },
            });
        });
    });

    describe('[HTTP-JOBS-OWN-001]', () => {
        it('propagates not-found when the job is not owned by the user', async () => {
            const mockRequest = buildRequest();
            mockGetById.mockRejectedValue(new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE));

            await expect(getJob(mockRequest, mockResponse)).rejects.toThrow(ResourceNotFoundException);
            expect(mockGetById).toHaveBeenCalledWith('job-id-1', 'user-id-1');
            expect(mockResponseStatus).not.toHaveBeenCalled();
            expect(mockResponseJson).not.toHaveBeenCalled();
        });
    });
});
