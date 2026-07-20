const events = {
    jobs: {
        jobsAggregated: 'jobs-aggregated',
        jobsRunning: 'jobs-running',
        jobsScheduled: 'jobs-scheduled',
        jobTargetFinished: 'job-target-finished',
        jobFinished: 'job-finished',
        jobFailed: 'job-failed',
        jobCancelled: 'job-cancelled',
    },
} as const;

export default events;
