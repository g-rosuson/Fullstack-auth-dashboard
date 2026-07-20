import { Mock } from 'vitest';

import { streamJobs } from '../jobs-controller';

import constants from 'shared/constants';

import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for stream-jobs HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/specification/architecture/http/jobs/stream.md
 */

/**
 * Mocks for the request and response objects.
 */
const mockResponseWrite = vi.fn();
const mockResponseFlushHeaders = vi.fn();
const mockResponseSetHeader = vi.fn();
const mockResponse = {
    write: mockResponseWrite,
    flushHeaders: mockResponseFlushHeaders,
    setHeader: mockResponseSetHeader,
} as unknown as Response;
const mockRequestOn = vi.fn();

const mockTargetFinishedEvent = {
    jobId: 'job-id-1',
    userId: 'user-id-1',
    type: constants.events.jobs.jobTargetFinished,
};

const mockRequest = {
    context: {
        user: { id: 'user-id-1' },
        delegator: {
            runningJobs: new Map([
                ['job-id-1', { payload: { userId: 'user-id-1' } }],
                ['job-id-2', { payload: { userId: 'user-id-2' } }],
            ]),
        },
        scheduler: {
            getAllJobs: vi.fn(() => [
                { jobId: 'job-id-1', userId: 'user-id-1', status: 'idle' },
                { jobId: 'job-id-other', userId: 'user-id-2', status: 'idle' },
            ]),
        },
        emitter: {
            allEmittedJobTargetEvents: [mockTargetFinishedEvent],
            on: vi.fn(),
            off: vi.fn(),
        },
    },
    on: mockRequestOn,
} as unknown as Request;

describe('jobs-controller streamJobs', () => {
    /**
     * Parses the mock write function to return the events.
     * @param mockWrite The mock write function to parse
     * @returns The parsed events
     */
    const parseSSE = (mockWrite: Mock) => {
        const raw = mockWrite.mock.calls.map(c => c[0]).join('');

        return raw
            .split('\n\n')
            .filter(Boolean)
            .map(chunk => {
                const [eventLine, dataLine] = chunk.split('\n');

                return {
                    event: eventLine.replace('event: ', ''),
                    data: JSON.parse(dataLine.replace('data: ', '')),
                };
            });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        streamJobs(mockRequest, mockResponse);
    });

    describe('[HTTP-JOBS-STR-001]', () => {
        it('should handle header setup correctly', () => {
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
            expect(mockResponseFlushHeaders).toHaveBeenCalled();
        });

        it('should detach listeners when the connection is closed', () => {
            const closeHandler = (mockRequestOn as Mock).mock.calls[0][1];

            closeHandler?.();

            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobsRunning,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobsScheduled,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobTargetFinished,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobFinished,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobFailed,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.off).toHaveBeenCalledWith(
                constants.events.jobs.jobCancelled,
                expect.any(Function)
            );
        });
    });

    /** FR-JOBS-STR-002 — single aggregated connect snapshot. */
    describe('[HTTP-JOBS-STR-002]', () => {
        it('should emit one jobs-aggregated snapshot for the correct user', () => {
            const events = parseSSE(mockResponseWrite);

            expect(events).toEqual([
                {
                    event: constants.events.jobs.jobsAggregated,
                    data: {
                        runningJobs: [
                            {
                                jobId: 'job-id-1',
                                finishedEvents: [mockTargetFinishedEvent],
                            },
                        ],
                        scheduledJobs: [{ jobId: 'job-id-1', status: 'idle' }],
                        userId: 'user-id-1',
                        type: constants.events.jobs.jobsAggregated,
                    },
                },
            ]);
        });

        describe('when a buffered target event belongs to a job that is no longer running', () => {
            const replayRequestOn = vi.fn();
            const replayRequest = {
                context: {
                    user: { id: 'user-id-1' },
                    delegator: {
                        runningJobs: new Map<string, { payload: { userId: string } }>(),
                    },
                    scheduler: {
                        getAllJobs: vi.fn(() => []),
                    },
                    emitter: {
                        allEmittedJobTargetEvents: [
                            {
                                jobId: 'job-id-stale',
                                userId: 'user-id-1',
                                type: constants.events.jobs.jobTargetFinished,
                            },
                        ],
                        on: vi.fn(),
                        off: vi.fn(),
                    },
                },
                on: replayRequestOn,
            } as unknown as Request;

            beforeEach(() => {
                vi.clearAllMocks();
                streamJobs(replayRequest, mockResponse);
            });

            it('should omit that target-finished event from the aggregated snapshot', () => {
                const events = parseSSE(mockResponseWrite);

                expect(events).toEqual([
                    {
                        event: constants.events.jobs.jobsAggregated,
                        data: {
                            runningJobs: [],
                            scheduledJobs: [],
                            userId: 'user-id-1',
                            type: constants.events.jobs.jobsAggregated,
                        },
                    },
                ]);
            });
        });
    });

    describe('[HTTP-JOBS-STR-004]', () => {
        it('should attach listeners for events', () => {
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobsRunning,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobsScheduled,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobTargetFinished,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobFinished,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobFailed,
                expect.any(Function)
            );
            expect(mockRequest.context.emitter.on).toHaveBeenCalledWith(
                constants.events.jobs.jobCancelled,
                expect.any(Function)
            );
        });

        it('should stream a live targetFinished event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobTargetFinished)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                jobId: 'job-id-1',
                userId: 'user-id-1',
                type: constants.events.jobs.jobTargetFinished,
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobTargetFinished,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live targetFinished event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobTargetFinished)?.[1];

            mockResponseWrite.mockClear();

            handler({
                jobId: 'job-id-1',
                userId: 'user-id-99',
                type: constants.events.jobs.jobTargetFinished,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });

        it('should stream a live jobFinished event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobFinished)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                jobId: 'job-id-1',
                userId: 'user-id-1',
                type: constants.events.jobs.jobFinished,
                finishedAt: '2026-03-10T12:00:00.000Z',
                executionId: 'exec-1',
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobFinished,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live jobFinished event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobFinished)?.[1];

            mockResponseWrite.mockClear();

            handler({
                jobId: 'job-id-1',
                userId: 'user-id-99',
                type: constants.events.jobs.jobFinished,
                finishedAt: '2026-03-10T12:00:00.000Z',
                executionId: 'exec-1',
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });

        it('should stream a live runningJobs event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobsRunning)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                runningJobs: ['job-id-1'],
                userId: 'user-id-1',
                type: constants.events.jobs.jobsRunning,
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobsRunning,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live runningJobs event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobsRunning)?.[1];

            mockResponseWrite.mockClear();

            handler({
                runningJobs: ['job-other'],
                userId: 'user-id-99',
                type: constants.events.jobs.jobsRunning,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });

        it('should stream a live jobFailed event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobFailed)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                jobId: 'job-id-1',
                userId: 'user-id-1',
                executionId: 'exec-fail',
                failedAt: '2026-03-10T12:00:00.000Z',
                type: constants.events.jobs.jobFailed,
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobFailed,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live jobFailed event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobFailed)?.[1];

            mockResponseWrite.mockClear();

            handler({
                jobId: 'job-id-1',
                userId: 'user-id-99',
                executionId: 'exec-fail',
                failedAt: '2026-03-10T12:00:00.000Z',
                type: constants.events.jobs.jobFailed,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });

        /** FR-JOBS-STR-001 — live job-cancelled events. */
        it('should stream a live jobCancelled event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobCancelled)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                jobId: 'job-id-1',
                userId: 'user-id-1',
                executionId: 'exec-cancel',
                cancelledAt: '2026-03-10T12:00:00.000Z',
                lastRun: null,
                nextRun: null,
                type: constants.events.jobs.jobCancelled,
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobCancelled,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live jobCancelled event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobCancelled)?.[1];

            mockResponseWrite.mockClear();

            handler({
                jobId: 'job-id-1',
                userId: 'user-id-99',
                executionId: 'exec-cancel',
                cancelledAt: '2026-03-10T12:00:00.000Z',
                lastRun: null,
                nextRun: null,
                type: constants.events.jobs.jobCancelled,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });
    });
});
