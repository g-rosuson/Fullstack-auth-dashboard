import { getAllJobs } from '../jobs-controller';

import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for list-jobs HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/specification/architecture/http/jobs/read.md
 * @see documentation/specification/architecture/http/jobs/ownership.md
 */

/**
 * Mocks for the get all jobs function.
 */
const mockGetAllByUserId = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
} as unknown as Response;

/**
 * Builds a request for the get all jobs function.
 * @param query Optional query params
 * @returns The request
 */
const buildRequest = (query: Record<string, string> = {}) =>
    ({
        query,
        context: {
            user: { id: 'user-id-1' },
            db: {
                repository: {
                    jobs: {
                        getAllByUserId: mockGetAllByUserId,
                    },
                },
            },
        },
    }) as unknown as Request;

describe('jobs-controller getAllJobs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResponseStatus.mockReturnValue(mockResponse);
    });

    describe('[HTTP-JOBS-LST-001]', () => {
        it('should fetch paginated jobs using parsed limit and offset query params', async () => {
            const mockRequest = buildRequest({
                limit: '10',
                offset: '20',
            });
            const jobs = [
                { id: 'job-id-1', name: 'Backend jobs', schedule: null },
                { id: 'job-id-2', name: 'Frontend jobs', schedule: null },
            ];

            mockGetAllByUserId.mockResolvedValue(jobs);

            await getAllJobs(mockRequest, mockResponse);

            expect(mockGetAllByUserId).toHaveBeenCalledWith('user-id-1', 10, 20);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: jobs,
                limit: 10,
                offset: 20,
                count: 2,
                meta: {
                    timestamp: expect.any(String),
                },
            });
        });

        it('should default limit and offset to zero when query params are missing', async () => {
            const mockRequest = buildRequest();
            const jobs = [{ id: 'job-id-1', name: 'Backend jobs', schedule: null }];

            mockGetAllByUserId.mockResolvedValue(jobs);

            await getAllJobs(mockRequest, mockResponse);

            expect(mockGetAllByUserId).toHaveBeenCalledWith('user-id-1', 0, 0);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: jobs,
                limit: 0,
                offset: 0,
                count: 1,
                meta: {
                    timestamp: expect.any(String),
                },
            });
        });

        it('should return persisted schedule', async () => {
            const mockRequest = buildRequest();
            const jobs = [
                {
                    id: 'job-id-1',
                    name: 'Scheduled jobs',
                    schedule: {
                        type: 'daily',
                        startDate: '2026-04-18T08:30:00.000Z',
                        endDate: null,
                        status: 'idle',
                    },
                },
                {
                    id: 'job-id-2',
                    name: 'Manual jobs',
                    schedule: null,
                },
            ];

            mockGetAllByUserId.mockResolvedValue(jobs);

            await getAllJobs(mockRequest, mockResponse);

            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: jobs,
                limit: 0,
                offset: 0,
                count: 2,
                meta: {
                    timestamp: expect.any(String),
                },
            });
        });

        it('scopes the list fetch to the requesting user', async () => {
            const mockRequest = buildRequest({ limit: '5', offset: '1' });
            mockGetAllByUserId.mockResolvedValue([]);

            await getAllJobs(mockRequest, mockResponse);

            expect(mockGetAllByUserId).toHaveBeenCalledTimes(1);
            expect(mockGetAllByUserId).toHaveBeenCalledWith('user-id-1', 5, 1);
        });
    });
});
