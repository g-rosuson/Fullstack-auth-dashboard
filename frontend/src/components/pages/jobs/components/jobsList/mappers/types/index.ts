import type { Job, JobSchedule, ScheduledJobEvent } from '@/_types/_gen';

/**
 * Parameters for mapping to schedule.
 */
interface MapToScheduleParams {
    job: Job;
    streamSchedule?: ScheduledJobEvent;
}

/**
 * Parameters for mapping to status.
 */
interface MapToStatusParams {
    persistedSchedule: JobSchedule;
    streamSchedule?: ScheduledJobEvent;
    isRunning: boolean;
}

export type { MapToScheduleParams, MapToStatusParams };
