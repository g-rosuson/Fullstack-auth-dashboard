import { z } from 'zod';

import { jobDocumentSchema, jobScheduleSchema, jobScheduleStatusSchema, jobSchema } from 'shared/schemas/jobs';

/**
 * A job schedule type.
 */
type JobSchedule = z.infer<typeof jobScheduleSchema>;

/**
 * A job document type.
 */
type JobDocument = z.infer<typeof jobDocumentSchema>;

/**
 * A job type.
 */
type Job = z.infer<typeof jobSchema>;

/**
 * A job status type.
 */
type JobScheduleStatus = z.infer<typeof jobScheduleStatusSchema>;

export type { JobSchedule, JobDocument, Job, JobScheduleStatus };
