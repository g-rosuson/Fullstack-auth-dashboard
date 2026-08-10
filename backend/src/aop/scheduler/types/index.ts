import { ScheduledTask } from 'node-cron';

import { CronJobType } from 'shared/types/cron';
import { JobScheduleStatus } from 'shared/types/jobs';

interface FormatCronExpressionPayload {
    startDate: Date;
    type: Exclude<CronJobType, 'once'>;
}

interface SchedulePayload {
    jobId: string;
    userId: string;
    type: CronJobType;
    startDate: string;
    endDate: string | null;
    isStopped?: boolean;
}

interface CronJob {
    jobId: string;
    userId: string;
    type: CronJobType;
    status: JobScheduleStatus;
    cronExpression: string | undefined;
    startDate: Date;
    endDate: Date | null;
    cronTask: ScheduledTask | undefined;
    metadata: {
        startTimeoutId: NodeJS.Timeout | undefined;
        stopTimeoutId: NodeJS.Timeout | undefined;
    };
}

interface NextAndPreviousRunPayload {
    nextRun: Date | null;
    previousRun: Date | null;
}

/** Persisted recurring schedule (no in-memory CronJob) — used at DB init / cold start */
interface NextRunFromPersistedSchedulePayload {
    type: Exclude<NonNullable<CronJobType>, 'once'>;
    startDate: string;
    endDate: string | null;
}

export type {
    CronJob,
    SchedulePayload,
    FormatCronExpressionPayload,
    NextAndPreviousRunPayload,
    NextRunFromPersistedSchedulePayload,
};
