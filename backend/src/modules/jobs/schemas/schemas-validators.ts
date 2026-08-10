import { z } from 'zod';

import { ErrorMessage } from 'shared/enums/error-messages';
import { CronJobType } from 'shared/types/cron';

/**
 * Validates the job schedule.
 *
 * If: Start date is in the past, add an issue.
 * If: End date is before start date, add an issue.
 * @param payload - The job payload
 * @param ctx - The refinement context
 */
const validateJobSchedule = (
    payload: {
        schedule?: { type: CronJobType; startDate?: string; endDate?: string | null } | null;
    },
    ctx: z.RefinementCtx
) => {
    const startDate = payload.schedule?.startDate ? new Date(payload.schedule.startDate) : null;
    const endDate = payload.schedule?.endDate ? new Date(payload.schedule.endDate) : null;

    // FR-JOBS-SCH-001 — When a schedule is set or changed, start time shall be in the future
    if (startDate && startDate < new Date()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: ErrorMessage.JOBS_START_DATE_MUST_BE_IN_THE_FUTURE,
            path: ['schedule', 'startDate'],
            fatal: true,
        });
    }

    // FR-JOBS-SCH-002 — When an end time is set, it shall be after the start time
    if (endDate && startDate && startDate > endDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: ErrorMessage.JOBS_START_DATE_MUST_COME_BEFORE_END_DATE,
            path: ['schedule', 'startDate'],
            fatal: true,
        });
    }

    // FR-JOBS-SCH-006 — Recurring schedule shall not be activated when end is now or past
    if (endDate && endDate < new Date()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: ErrorMessage.JOBS_END_DATE_MUST_BE_IN_THE_FUTURE,
            path: ['schedule', 'endDate'],
            fatal: true,
        });
    }

    // FR-JOBS-ONCE-001 — A once schedule shall not have an end time
    if (payload.schedule?.type === 'once' && endDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: ErrorMessage.JOBS_ONCE_TYPE_CANNOT_HAVE_END_DATE,
            path: ['schedule', 'endDate'],
            fatal: true,
        });
    }
};

export { validateJobSchedule };
