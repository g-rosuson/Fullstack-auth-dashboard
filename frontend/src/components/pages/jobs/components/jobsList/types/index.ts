import type { JobScheduleType } from '@/_types/_gen';

import jobListConstants from '@/components/pages/jobs/components/jobsList/constants';
import jobConstants from '@/components/pages/jobs/constants';

/**
 * Execution action types.
 * @private
 */
const executionActionTypes = {
    ...jobListConstants.key.action.execution,
    ...jobListConstants.key.action.schedule,
};

/**
 * Execution action type.
 * @public
 */
type ActionType = (typeof executionActionTypes)[keyof typeof executionActionTypes];

/**
 * Job lifecycle status key derived from schedule + execution state.
 * @public
 */
type JobStatus = (typeof jobConstants.key.status)[keyof typeof jobConstants.key.status];

/**
 * Mapped schedule for the job UI.
 * @public
 */
interface Schedule {
    type: Capitalize<JobScheduleType> | null;
    startDate: string;
    endDate: string;
    nextRun: string;
    lastRun: string;
}

/**
 * Confirmable action.
 * @public
 */
type ConfirmableAction = (typeof jobListConstants.key.confirmation)[keyof typeof jobListConstants.key.confirmation];

/**
 * Pending confirmation.
 */
interface PendingConfirmation {
    action: ConfirmableAction;
    jobId: string;
}

export type { ActionType, JobStatus, Schedule, ConfirmableAction, PendingConfirmation };
