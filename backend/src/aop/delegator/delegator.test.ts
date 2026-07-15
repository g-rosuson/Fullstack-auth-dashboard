import constants from 'shared/constants';

import type { Tool } from 'shared/types/jobs/tools/types-tools';
import type { ToolTargetName, ToolType } from 'shared/types/jobs/tools/types-tools';

import { Delegator } from './';

/**
 * Verification: unit proofs for job execution runtime (cite FR IDs).
 * @see documentation/requirements/fr/jobs/execution/execution.md
 *
 * Out of scope here (covered elsewhere):
 * - FR-JOBS-RUN-003 — manual start UX / HTTP entry
 * - FR-JOBS-RUN-004 — reject while running (controllers gate on `runningJobs`)
 * - FR-JOBS-STR-003 — client consumes the stream without reload
 * - FR-JOBS-STR-004 / STR-005 — schedule-attach failure observability (scheduler/HTTP)
 *
 * No job-execution NFRs are defined yet under documentation/requirements/nfr/.
 */

const mockTool = {
    type: 'tool' as ToolType,
    keywords: ['keyword-1', 'keyword-2'],
    maxPages: 1,
    targets: [{ targetId: 'target-1', target: 'target' as unknown as ToolTargetName }],
    testId: 'test-id-1',
    toolId: 'tool-id-1',
} as Tool & { testId: string };
const mockToolTwo = {
    type: 'tool' as ToolType,
    keywords: ['keyword-3', 'keyword-4'],
    maxPages: 1,
    targets: [{ targetId: 'target-2', target: 'target' as unknown as ToolTargetName }],
    testId: 'test-id-2',
} as Tool & { testId: string };
const mockPayloadWithTool = {
    jobId: 'test-job-id',
    userId: 'test-user-id',
    tools: [mockTool, mockToolTwo],
    scheduleType: null,
};

const mockRecurringPayload = {
    ...mockPayloadWithTool,
    scheduleType: 'daily' as const,
};

const mockOncePayload = {
    ...mockPayloadWithTool,
    scheduleType: 'once' as const,
};

const mockTargetListing = {
    target: 'jobs-ch' as const,
    targetId: 'target-1',
    results: [
        {
            listing: {
                ok: true as const,
                listingKey: 'k-a',
                source: 'jobs-ch' as const,
                url: 'https://example.com/a',
                title: 'A',
                text: 'A',
            },
        },
    ],
};

const mockTargetListingTwo = {
    target: 'jobs-ch' as const,
    targetId: 'target-2',
    results: [
        {
            listing: {
                ok: true as const,
                listingKey: 'k-b',
                source: 'jobs-ch' as const,
                url: 'https://example.com/b',
                title: 'B',
                text: 'B',
            },
        },
    ],
};

vi.mock('aop/db/mongo/client', () => ({
    MongoClientManager: {
        getInstance: vi.fn(() => ({
            connect: vi.fn().mockResolvedValue({}),
            startSession: vi.fn(),
        })),
    },
}));

const mockAddExecution = vi.fn();
vi.mock('aop/db/mongo/context', () => ({
    DbContext: vi.fn().mockImplementation(() => ({
        repository: { jobs: { addExecution: mockAddExecution } },
    })),
}));

const mockEmit = vi.fn();
const mockClearJobTargetEvents = vi.fn();
vi.mock('aop/emitter', () => ({
    Emitter: {
        getInstance: vi.fn(() => ({
            emit: mockEmit,
            clearJobTargetEvents: mockClearJobTargetEvents,
        })),
    },
}));

const mockGetNextAndPreviousRun = vi.hoisted(() =>
    vi.fn(() => ({
        nextRun: null as Date | null,
        previousRun: null as Date | null,
    }))
);
vi.mock('aop/scheduler', () => ({
    Scheduler: {
        getInstance: vi.fn(() => ({
            getNextAndPreviousRun: mockGetNextAndPreviousRun,
        })),
    },
}));

const mockLoggerError = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
vi.mock('aop/logging', () => ({
    logger: {
        info: mockLoggerInfo,
        warn: vi.fn(),
        error: mockLoggerError,
    },
}));

vi.mock('config', () => ({
    default: {
        maxDbRetries: 1,
        dbRetryDelayMs: 0,
    },
}));

const mockExecute = vi.hoisted(() => vi.fn());
vi.mock('./tools', () => ({
    default: {
        tool: {
            execute: mockExecute,
        },
    },
}));

describe('Delegator', () => {
    let delegator: Delegator;

    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue(undefined);
        mockAddExecution.mockResolvedValue(undefined);
        mockGetNextAndPreviousRun.mockReturnValue({ nextRun: null, previousRun: null });
        // Reset the singleton instance for isolated tests
        // @ts-expect-error - accessing private static property for testing
        Delegator.instance = null;
        delegator = Delegator.getInstance();
    });

    describe('getInstance', () => {
        it('returns the same singleton instance', () => {
            expect(Delegator.getInstance()).toBe(Delegator.getInstance());
        });
    });

    describe('[FR-JOBS-RUN-001] — execute tools when the job is run', () => {
        it('adds the job to runningJobs while tools execute', async () => {
            mockExecute.mockImplementation(async () => {
                expect(delegator.runningJobs.has(mockPayloadWithTool.jobId)).toBe(true);
            });

            await delegator.delegate(mockPayloadWithTool);
        });

        it('removes the job from runningJobs after the run completes', async () => {
            await delegator.delegate(mockPayloadWithTool);
            expect(delegator.runningJobs.has(mockPayloadWithTool.jobId)).toBe(false);
        });

        it('invokes tools sequentially', async () => {
            const callQueue: string[] = [];

            mockExecute.mockImplementation(async ({ tool }: { tool: typeof mockTool }) => {
                callQueue.push(`${tool.testId}-start`);
                await new Promise(resolve => setTimeout(resolve, 10));
                callQueue.push(`${tool.testId}-end`);
            });

            await delegator.delegate(mockPayloadWithTool);

            expect(mockExecute).toHaveBeenCalledTimes(2);
            expect(callQueue).toEqual(['test-id-1-start', 'test-id-1-end', 'test-id-2-start', 'test-id-2-end']);
        });

        it('runs a registered job when the schedule fires via delegateScheduledJob', async () => {
            delegator.register(mockPayloadWithTool);

            await delegator.delegateScheduledJob('test-job-id');

            expect(mockExecute).toHaveBeenCalled();
            expect(mockAddExecution).toHaveBeenCalled();
        });

        it('logs and skips when no registered job exists for the id', async () => {
            await delegator.delegateScheduledJob('unknown-job-id');

            expect(mockExecute).not.toHaveBeenCalled();
            expect(mockAddExecution).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalled();
        });

        it('keeps a recurring job pending so a later tick can run again', async () => {
            delegator.register(mockRecurringPayload);
            await delegator.delegateScheduledJob('test-job-id');

            mockExecute.mockClear();
            mockAddExecution.mockClear();
            mockLoggerError.mockClear();

            await delegator.delegateScheduledJob('test-job-id');

            expect(mockExecute).toHaveBeenCalled();
            expect(mockAddExecution).toHaveBeenCalled();
            expect(mockLoggerError).not.toHaveBeenCalled();
        });

        it('drops a once job from pending after the first run', async () => {
            delegator.register(mockOncePayload);
            await delegator.delegateScheduledJob('test-job-id');

            mockExecute.mockClear();
            mockAddExecution.mockClear();
            mockLoggerError.mockClear();

            await delegator.delegateScheduledJob('test-job-id');

            expect(mockExecute).not.toHaveBeenCalled();
            expect(mockAddExecution).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalled();
        });

        it('drops an unscheduled job from pending after an immediate run', async () => {
            delegator.register(mockPayloadWithTool);
            await delegator.delegate(mockPayloadWithTool);

            mockExecute.mockClear();
            mockLoggerError.mockClear();

            await delegator.delegateScheduledJob('test-job-id');

            expect(mockExecute).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalled();
        });
    });

    describe('[FR-JOBS-RUN-002] — record executions', () => {
        it('persists an execution payload with schedule timestamps and tools', async () => {
            await delegator.delegate(mockPayloadWithTool);

            expect(mockAddExecution).toHaveBeenCalledWith(
                expect.objectContaining({
                    executionId: expect.any(String),
                    jobId: 'test-job-id',
                    schedule: {
                        type: null,
                        delegatedAt: expect.any(String),
                        finishedAt: expect.any(String),
                    },
                    tools: [
                        expect.objectContaining({
                            type: 'tool',
                            keywords: ['keyword-1', 'keyword-2'],
                            targets: [],
                        }),
                        expect.objectContaining({
                            type: 'tool',
                            keywords: ['keyword-3', 'keyword-4'],
                            targets: [],
                        }),
                    ],
                })
            );
            expect(mockLoggerInfo).toHaveBeenCalled();
        });

        it('persists targets populated by onTargetFinish', async () => {
            mockExecute.mockImplementation(
                // eslint-disable-next-line no-unused-vars
                async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListing) => void }) => {
                    onTargetFinish(mockTargetListing);
                }
            );

            await delegator.delegate(mockPayloadWithTool);

            expect(mockAddExecution).toHaveBeenCalledWith(
                expect.objectContaining({
                    tools: [
                        expect.objectContaining({
                            targets: [
                                expect.objectContaining({
                                    target: 'jobs-ch',
                                    targetId: 'target-1',
                                    results: [
                                        expect.objectContaining({
                                            listing: expect.objectContaining({
                                                ok: true,
                                                url: 'https://example.com/a',
                                                title: 'A',
                                            }),
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        expect.objectContaining({
                            targets: [
                                expect.objectContaining({
                                    target: 'jobs-ch',
                                    targetId: 'target-1',
                                    results: expect.any(Array),
                                }),
                            ],
                        }),
                    ],
                })
            );
        });

        it('logs persistence failures without throwing and still finishes the run', async () => {
            mockAddExecution.mockRejectedValue(new Error('db write failed'));

            await expect(delegator.delegate(mockPayloadWithTool)).resolves.toBeUndefined();

            expect(mockLoggerError).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ error: expect.any(Error) })
            );
            expect(delegator.runningJobs.has('test-job-id')).toBe(false);
            expect(mockClearJobTargetEvents).toHaveBeenCalledWith('test-job-id');

            const emittedTypes = mockEmit.mock.calls.map(([payload]) => payload.type);
            expect(emittedTypes).toContain(constants.events.jobs.jobFinished);
            expect(emittedTypes).not.toContain(constants.events.jobs.jobFailed);
        });

        it('does not persist when tool execution fails before completion', async () => {
            mockExecute.mockRejectedValue(new Error('tool exploded'));

            await delegator.delegate(mockPayloadWithTool);

            expect(mockAddExecution).not.toHaveBeenCalled();
        });
    });

    describe('[FR-JOBS-STR-001] — live activity events', () => {
        it('emits running-jobs with the job id and owner userId when the run starts', async () => {
            mockExecute.mockImplementation(async () => {
                expect(mockEmit).toHaveBeenCalledWith({
                    type: constants.events.jobs.runningJobs,
                    runningJobs: ['test-job-id'],
                    userId: 'test-user-id',
                });
            });

            await delegator.delegate(mockPayloadWithTool);
        });

        it('emits events in order: running-jobs, target-finished…, job-finished', async () => {
            mockExecute
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListing) => void }) => {
                        onTargetFinish(mockTargetListing);
                    }
                )
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListingTwo) => void }) => {
                        onTargetFinish(mockTargetListingTwo);
                    }
                );

            await delegator.delegate(mockPayloadWithTool);

            expect(mockEmit.mock.calls.map(([payload]) => payload.type)).toEqual([
                constants.events.jobs.runningJobs,
                constants.events.jobs.targetFinished,
                constants.events.jobs.targetFinished,
                constants.events.jobs.jobFinished,
            ]);
        });

        it('emits target-finished for each completed target', async () => {
            mockExecute
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListing) => void }) => {
                        onTargetFinish(mockTargetListing);
                    }
                )
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListingTwo) => void }) => {
                        onTargetFinish(mockTargetListingTwo);
                    }
                );

            await delegator.delegate(mockPayloadWithTool);

            const targetFinishedPayloads = mockEmit.mock.calls
                .map(([payload]) => payload as { type: string })
                .filter(p => p.type === constants.events.jobs.targetFinished);

            expect(targetFinishedPayloads).toHaveLength(2);
            expect(targetFinishedPayloads[0]).toEqual(
                expect.objectContaining({
                    jobId: 'test-job-id',
                    userId: 'test-user-id',
                    executionId: expect.any(String),
                    schedule: {
                        type: null,
                        delegatedAt: expect.any(String),
                        finishedAt: null,
                    },
                    tool: mockTool,
                    target: mockTargetListing,
                    type: constants.events.jobs.targetFinished,
                })
            );
            expect(targetFinishedPayloads[1]).toEqual(
                expect.objectContaining({
                    jobId: 'test-job-id',
                    userId: 'test-user-id',
                    tool: mockToolTwo,
                    target: mockTargetListingTwo,
                    type: constants.events.jobs.targetFinished,
                })
            );
        });

        it('emits job-finished with nextRun and lastRun from the scheduler', async () => {
            const nextRun = new Date('2026-03-12T08:30:00.000Z');
            const previousRun = new Date('2026-03-11T08:30:00.000Z');
            mockGetNextAndPreviousRun.mockReturnValue({ nextRun, previousRun });

            await delegator.delegate(mockRecurringPayload);

            expect(mockGetNextAndPreviousRun).toHaveBeenCalledWith('test-job-id');
            expect(mockEmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobFinished,
                    jobId: 'test-job-id',
                    userId: 'test-user-id',
                    executionId: expect.any(String),
                    finishedAt: expect.any(String),
                    nextRun: nextRun.toISOString(),
                    lastRun: previousRun.toISOString(),
                })
            );
        });

        it('emits job-finished with null nextRun and lastRun when the scheduler has none', async () => {
            await delegator.delegate(mockPayloadWithTool);

            expect(mockEmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobFinished,
                    nextRun: null,
                    lastRun: null,
                })
            );
        });

        it('uses the same execution id on all success events for one run', async () => {
            mockExecute
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListing) => void }) => {
                        onTargetFinish(mockTargetListing);
                    }
                )
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListingTwo) => void }) => {
                        onTargetFinish(mockTargetListingTwo);
                    }
                );

            await delegator.delegate(mockPayloadWithTool);

            const payloads = mockEmit.mock.calls.map(([p]) => p as { type: string; executionId?: string });
            const jobFinished = payloads.find(p => p.type === constants.events.jobs.jobFinished);
            const targetFinished = payloads.filter(p => p.type === constants.events.jobs.targetFinished);

            expect(jobFinished?.executionId).toEqual(expect.any(String));
            expect(targetFinished).toHaveLength(2);
            for (const p of targetFinished) {
                expect(p.executionId).toBe(jobFinished?.executionId);
            }
        });

        it('emits job-failed and cleans up when tool execution fails', async () => {
            mockExecute.mockRejectedValue(new Error('tool exploded'));

            await delegator.delegate(mockPayloadWithTool);

            expect(delegator.runningJobs.has('test-job-id')).toBe(false);
            expect(mockClearJobTargetEvents).toHaveBeenCalledWith('test-job-id');
            expect(mockEmit.mock.calls.map(([payload]) => payload.type)).toEqual([
                constants.events.jobs.runningJobs,
                constants.events.jobs.jobFailed,
            ]);
            expect(mockEmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: constants.events.jobs.jobFailed,
                    jobId: 'test-job-id',
                    userId: 'test-user-id',
                    executionId: expect.any(String),
                    failedAt: expect.any(String),
                })
            );
            expect(mockLoggerError).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ error: expect.any(Error) })
            );
        });

        it('emits job-failed after a later tool fails, without job-finished', async () => {
            mockExecute
                .mockImplementationOnce(
                    // eslint-disable-next-line no-unused-vars
                    async ({ onTargetFinish }: { onTargetFinish: (target: typeof mockTargetListing) => void }) => {
                        onTargetFinish(mockTargetListing);
                    }
                )
                .mockRejectedValueOnce(new Error('second tool exploded'));

            await delegator.delegate(mockPayloadWithTool);

            const emittedTypes = mockEmit.mock.calls.map(([payload]) => payload.type);
            expect(emittedTypes).toEqual([
                constants.events.jobs.runningJobs,
                constants.events.jobs.targetFinished,
                constants.events.jobs.jobFailed,
            ]);
            expect(mockAddExecution).not.toHaveBeenCalled();
            expect(delegator.runningJobs.has('test-job-id')).toBe(false);
        });

        it('clears buffered job target events after the run ends', async () => {
            await delegator.delegate(mockPayloadWithTool);

            expect(mockClearJobTargetEvents).toHaveBeenCalledWith('test-job-id');
            expect(mockClearJobTargetEvents).toHaveBeenCalledTimes(1);
        });
    });

    describe('removeJob', () => {
        it('clears pending, running, and buffered target events for the job id', async () => {
            delegator.register(mockRecurringPayload);
            mockExecute.mockImplementation(async () => {
                expect(delegator.runningJobs.has('test-job-id')).toBe(true);
                delegator.removeJob('test-job-id');
                expect(delegator.runningJobs.has('test-job-id')).toBe(false);
            });

            await delegator.delegate(mockRecurringPayload);

            expect(mockClearJobTargetEvents).toHaveBeenCalledWith('test-job-id');

            mockExecute.mockClear();
            mockLoggerError.mockClear();
            await delegator.delegateScheduledJob('test-job-id');
            expect(mockExecute).not.toHaveBeenCalled();
            expect(mockLoggerError).toHaveBeenCalled();
        });
    });
});
