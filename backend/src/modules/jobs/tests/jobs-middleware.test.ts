import { Request, Response } from 'express';

import { InputValidationException } from 'aop/exceptions/errors/validation';

import {
    validateChangeScheduleStatusPayload,
    validateCreateOrUpdateJobPayload,
    validateIdQueryParams,
    validatePaginationQueryParams,
} from '../jobs-middleware';

import constants from 'shared/constants';

import type { CreateJobInput, UpdateJobInput } from '../types';

/**
 * Verification: unit proofs for jobs middleware gates (exception type + next()).
 * Full HTTP envelopes for invalid bodies live in integration (`HTTP-JOBS-CRT-006`, `UPD-007`, `SSC-009`).
 *
 * @see documentation/architecture/http/jobs/create.md
 * @see documentation/architecture/http/jobs/update.md
 * @see documentation/architecture/http/jobs/schedule-status.md
 * @see documentation/architecture/http/jobs/read.md
 */

const futureStart = () => new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

const validCreateBody = (): CreateJobInput => ({
    name: 'Middleware create job',
    schedule: null,
    tools: [
        {
            type: 'scraper',
            keywords: ['typescript'],
            maxPages: 1,
            targets: [{ target: 'jobs-ch' }],
        },
    ],
});

const validUpdateBody = (): UpdateJobInput => ({
    ...validCreateBody(),
    status: constants.status.schedule.idle,
});

describe('jobs-middleware', () => {
    describe('validateCreateOrUpdateJobPayload', () => {
        describe('[HTTP-JOBS-CRT-001]', () => {
            it('calls next with a validated create body', () => {
                const mockNext = vi.fn();
                const body = validCreateBody();
                const request = {
                    path: constants.routes.jobs.create,
                    body,
                } as Request;

                validateCreateOrUpdateJobPayload(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.body).toEqual(body);
            });
        });

        describe('[HTTP-JOBS-UPD-001]', () => {
            it('calls next with a validated update body', () => {
                const mockNext = vi.fn();
                const body = validUpdateBody();
                const request = {
                    path: constants.routes.jobs.update,
                    body,
                } as Request;

                validateCreateOrUpdateJobPayload(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.body).toEqual(body);
            });
        });

        describe('[HTTP-JOBS-CRT-006]', () => {
            it('rejects an invalid create body', () => {
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.jobs.create,
                    body: { ...validCreateBody(), name: undefined },
                } as unknown as Request;

                expect(() => validateCreateOrUpdateJobPayload(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });

            it('rejects when scraper keywords are missing on tool and target', () => {
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.jobs.create,
                    body: {
                        name: 'Bad scraper',
                        schedule: null,
                        tools: [
                            {
                                type: 'scraper',
                                maxPages: 1,
                                targets: [{ target: 'jobs-ch', maxPages: 1 }],
                            },
                        ],
                    },
                } as Request;

                expect(() => validateCreateOrUpdateJobPayload(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });

            it('rejects a schedule whose start date is not in the future', () => {
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.jobs.create,
                    body: {
                        ...validCreateBody(),
                        schedule: {
                            status: constants.status.schedule.idle,
                            type: 'daily',
                            startDate: new Date(Date.now() - 86_400_000).toISOString(),
                            endDate: null,
                        },
                    },
                } as Request;

                expect(() => validateCreateOrUpdateJobPayload(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        describe('[HTTP-JOBS-UPD-007]', () => {
            it('rejects an update body missing runJob', () => {
                const mockNext = vi.fn();
                const body = validUpdateBody();
                const request = {
                    path: constants.routes.jobs.update,
                    body: { name: body.name, schedule: body.schedule, tools: body.tools },
                } as unknown as Request;

                expect(() => validateCreateOrUpdateJobPayload(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        it('accepts a create body with a future idle schedule', () => {
            const mockNext = vi.fn();
            const request = {
                path: constants.routes.jobs.create,
                body: {
                    ...validCreateBody(),
                    schedule: {
                        status: constants.status.schedule.idle,
                        type: 'daily',
                        startDate: futureStart(),
                        endDate: null,
                    },
                },
            } as Request;

            validateCreateOrUpdateJobPayload(request, {} as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('validateChangeScheduleStatusPayload', () => {
        describe('[HTTP-JOBS-SSC-001]', () => {
            it('calls next with a validated status body', () => {
                const mockNext = vi.fn();
                const request = {
                    body: { status: constants.status.schedule.stopped },
                } as Request;

                validateChangeScheduleStatusPayload(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.body).toEqual({ status: constants.status.schedule.stopped });
            });
        });

        describe('[HTTP-JOBS-SSC-009]', () => {
            it('rejects an invalid status body', () => {
                const mockNext = vi.fn();
                const request = {
                    body: { status: 'running' },
                } as Request;

                expect(() => validateChangeScheduleStatusPayload(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });
    });

    describe('validateIdQueryParams', () => {
        describe('[HTTP-JOBS-GET-001]', () => {
            it('calls next with a validated id param', () => {
                const mockNext = vi.fn();
                const request = {
                    params: { id: 'job-id-1' },
                } as unknown as Request;

                validateIdQueryParams(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.params).toEqual({ id: 'job-id-1' });
            });
        });

        it('rejects when id is missing', () => {
            const mockNext = vi.fn();
            const request = {
                params: {},
            } as unknown as Request;

            expect(() => validateIdQueryParams(request, {} as Response, mockNext)).toThrow(InputValidationException);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('validatePaginationQueryParams', () => {
        describe('[HTTP-JOBS-LST-001]', () => {
            it('calls next when pagination query is empty', () => {
                const mockNext = vi.fn();
                const request = {
                    query: {},
                } as unknown as Request;

                validatePaginationQueryParams(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
            });
        });

        describe('[HTTP-JOBS-LST-002]', () => {
            it('merges validated limit and offset into req.query', () => {
                const mockNext = vi.fn();
                const request = {
                    query: { limit: '10', offset: '2' },
                } as unknown as Request;

                validatePaginationQueryParams(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.query).toEqual(expect.objectContaining({ limit: '10', offset: '2' }));
            });
        });
    });
});
