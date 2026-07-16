const events = {
    jobs: {
        targetFinished: 'job-target-finished',
        runningJobs: 'running-jobs',
        scheduledJobs: 'scheduled-jobs',
        jobFinished: 'job-finished',
        jobFailed: 'job-failed',
        jobCancelled: 'job-cancelled',
    },
} as const;

export default events;
