import {
    type Job,
    JobScheduleStatus,
    JobScheduleType,
    type ScheduledJobEvent,
    ScraperToolTypeProperty,
} from '@/_types/_gen';

/**
 * Builds a scraper tool in the API shape used by jobs page tests.
 */
const buildScraperTool = () => ({
    type: ScraperToolTypeProperty.scraper,
    toolId: 'tool-1',
    keywords: ['react'],
    maxPages: 1,
    targets: [
        {
            target: 'jobs-ch' as const,
            targetId: 'target-1',
            keywords: ['remote'],
            maxPages: 1,
        },
    ],
});

/**
 * Builds a job with sensible defaults for jobs page tests.
 */
const buildJob = (overrides: Partial<Job> = {}): Job => ({
    id: 'job-1',
    userId: 'user-1',
    name: 'Alpha',
    createdAt: '2024-06-01T10:00:00.000Z',
    updatedAt: null,
    schedule: null,
    tools: [buildScraperTool()],
    executions: [],
    ...overrides,
});

/**
 * Builds a stream schedule overlay for a job.
 */
const buildStreamSchedule = (overrides: Partial<ScheduledJobEvent> = {}): ScheduledJobEvent => ({
    jobId: 'job-1',
    status: JobScheduleStatus.idle,
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    lastRun: null,
    ...overrides,
});

const futureIso = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastIso = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export { buildJob, buildScraperTool, buildStreamSchedule, futureIso, JobScheduleStatus, JobScheduleType, pastIso };
