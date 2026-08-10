import type { AggregatedRunningJob, Job, ScheduledJobEvent } from '@/_types/_gen';

interface JobsListProps {
    jobs: Job[];
    jobIdToRunningJob: Record<string, AggregatedRunningJob>;
    jobIdToScheduledJob: Record<string, ScheduledJobEvent>;
    isStreamHydrated: boolean;
    onEditJob: (jobId?: string) => void;
    onJobDeleted: (jobId: string) => void;
}

export type { JobsListProps };
