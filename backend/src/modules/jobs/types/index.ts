import { z } from 'zod';

import {
    changeJobScheduleStatusPayloadSchema,
    createJobInputSchema,
    createJobToolSchema,
    enrichedJobScheduleSchema,
    enrichedJobSchema,
    idRouteParamSchema,
    updateJobInputSchema,
    updateJobToolSchema,
} from '../schemas';

/**
 * A change cron job status payload schema.
 */
type ChangeCronJobStatusPayload = z.infer<typeof changeJobScheduleStatusPayloadSchema>;

/**
 * A create job tool schema.
 */
type CreateJobTool = z.infer<typeof createJobToolSchema>;

/**
 * A update job tool schema.
 */
type UpdateJobTool = z.infer<typeof updateJobToolSchema>;

/**
 * A create job input schema.
 */
type CreateJobInput = z.infer<typeof createJobInputSchema>;

/**
 * A update job input schema.
 */
type UpdateJobInput = z.infer<typeof updateJobInputSchema>;

/**
 * A enriched job schedule schema.
 */
type EnrichedJobSchedule = z.infer<typeof enrichedJobScheduleSchema>;

/**
 * A enriched job schema.
 */
type EnrichedJob = z.infer<typeof enrichedJobSchema>;

/**
 * A id route param schema.
 */
type IdRouteParam = z.infer<typeof idRouteParamSchema>;

export type {
    ChangeCronJobStatusPayload,
    CreateJobInput,
    CreateJobTool,
    EnrichedJob,
    EnrichedJobSchedule,
    IdRouteParam,
    UpdateJobInput,
    UpdateJobTool,
};
