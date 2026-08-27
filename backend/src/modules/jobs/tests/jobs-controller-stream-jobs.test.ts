import { Mock } from 'vitest';

import { streamJobs } from '../jobs-controller';

import constants from 'shared/constants';

import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for stream-jobs HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see docs/specs/architecture/http/jobs/stream.md
 */

const mockResponseWrite = vi.fn();
const mockResponseFlushHeaders = vi.fn();
const mockResponseSetHeader = vi.fn();
const mockResponseFlush = vi.fn();
const mockResponse = {
    write: mockResponseWrite,
    flushHeaders: mockResponseFlushHeaders,
    setHeader: mockResponseSetHeader,
    flush: mockResponseFlush,
} as unknown as Response;
const mockRequestOn = vi.fn();

const mockTargetFinishedEvent = {
    jobId: 'job-id-1',
    userId: 'user-id-1',
    type: constants.events.jobs.jobTargetFinished,
};

const mockScheduledJobEvent = {
    jobId: 'job-id-1',
    status: constants.status.schedule.idle,
    nextRun: '2026-04-20T08:30:00.000Z',
    lastRun: '2026-04-19T08:30:00.000Z',
};

const mockGetRunningJobsForUser = vi.fn(() => [{ jobId: 'job-id-1' }]);
const mockGetEmittedJobTargetEventsForUser = vi.fn(() => [mockTargetFinishedEvent]);
const mockGetCronJobEventsForUser = vi.fn(() => [mockScheduledJobEvent]);

const mockRequest = {
    context: {
        user: { id: 'user-id-1' },
        delegator: {
            getRunningJobsForUser: mockGetRunningJobsForUser,
        },
        scheduler: {
            getCronJobEventsForUser: mockGetCronJobEventsForUser,
        },
        emitter: {
            getEmittedJobTargetEventsForUser: mockGetEmittedJobTargetEventsForUser,
            on: vi.fn(),
            off: vi.fn(),
        },
    },
    on: mockRequestOn,
} as unknown as Request;

describe('jobs-controller streamJobs', () => {
    const parseSSE = (mockWrite: Mock) => {
        const raw = mockWrite.mock.calls.map(c => c[0]).join('');

        return raw
            .split('\n\n')
            .filter(Boolean)
            .flatMap(chunk => {
                const lines = chunk.split('\n').filter(line => line !== '' && !line.startsWith(':'));

                if (lines.length === 0) {
                    return [];
                }

                const eventLine = lines.find(line => line.startsWith('event: '));
                const dataLine = lines.find(line => line.startsWith('data: '));

                if (!eventLine || !dataLine) {
                    return [];
                }

                return [
                    {
                        event: eventLine.replace('event: ', ''),
                        data: JSON.parse(dataLine.replace('data: ', '')),
                    },
                ];
            });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRunningJobsForUser.mockReturnValue([{ jobId: 'job-id-1' }]);
        mockGetEmittedJobTargetEventsForUser.mockReturnValue([mockTargetFinishedEvent]);
        mockGetCronJobEventsForUser.mockReturnValue([mockScheduledJobEvent]);
        streamJobs(mockRequest, mockResponse);
    });

    describe('[HTTP-JOBS-STR-001]', () => {
        it('should handle header setup correctly', () => {
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
            expect(mockResponseSetHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
            expect(mockResponseSetHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
            expect(mockResponseFlushHeaders).toHaveBeenCalled();
            expect(mockResponseFlush).toHaveBeenCalled();
        });

        it('should prime WebKit with an SSE comment that does not dispatch an empty frame', () => {
            const firstWrite = mockResponseWrite.mock.calls[0]?.[0] as string;

            expect(firstWrite.startsWith(':')).toBe(true);
            expect(firstWrite.endsWith('\n\n')).toBe(false);
            expect(firstWrite.length).toBeGreaterThanOrEqual(2048);
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

    describe('[HTTP-JOBS-STR-002]', () => {
        it('should emit one jobs-aggregated snapshot for the correct user', () => {
            expect(mockGetRunningJobsForUser).toHaveBeenCalledWith('user-id-1');
            expect(mockGetEmittedJobTargetEventsForUser).toHaveBeenCalledWith('user-id-1');
            expect(mockGetCronJobEventsForUser).toHaveBeenCalledWith('user-id-1');

            const events = parseSSE(mockResponseWrite);

            expect(events).toEqual([
                {
                    event: constants.events.jobs.jobsAggregated,
                    data: {
                        runningJobs: [
                            {
                                jobId: 'job-id-1',
                                emittedEvents: [mockTargetFinishedEvent],
                            },
                        ],
                        scheduledJobs: [mockScheduledJobEvent],
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
                        getRunningJobsForUser: vi.fn(() => []),
                    },
                    scheduler: {
                        getCronJobEventsForUser: vi.fn(() => []),
                    },
                    emitter: {
                        getEmittedJobTargetEventsForUser: vi.fn(() => [
                            {
                                jobId: 'job-id-stale',
                                userId: 'user-id-1',
                                type: constants.events.jobs.jobTargetFinished,
                            },
                        ]),
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

    describe('[HTTP-JOBS-STR-003]', () => {
        it('should stream a live scheduled-jobs event with nextRun and lastRun', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobsScheduled)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                scheduledJobs: [mockScheduledJobEvent],
                userId: 'user-id-1',
                type: constants.events.jobs.jobsScheduled,
            };
            handler(liveEvent);

            expect(parseSSE(mockResponseWrite)).toEqual([
                {
                    event: constants.events.jobs.jobsScheduled,
                    data: liveEvent,
                },
            ]);
        });

        it('should not stream a live scheduled-jobs event for another user', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobsScheduled)?.[1];

            mockResponseWrite.mockClear();

            handler({
                scheduledJobs: [mockScheduledJobEvent],
                userId: 'user-id-99',
                type: constants.events.jobs.jobsScheduled,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
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

        it('should stream a live jobCancelled event to the client', () => {
            const onCalls = (mockRequest.context.emitter.on as Mock).mock.calls;
            const handler = onCalls.find(([event]) => event === constants.events.jobs.jobCancelled)?.[1];

            mockResponseWrite.mockClear();

            const liveEvent = {
                jobId: 'job-id-1',
                userId: 'user-id-1',
                executionId: 'exec-cancel',
                cancelledAt: '2026-03-10T12:00:00.000Z',
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
                type: constants.events.jobs.jobCancelled,
            });

            expect(parseSSE(mockResponseWrite)).toEqual([]);
        });
    });
});
