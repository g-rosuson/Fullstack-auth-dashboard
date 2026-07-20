import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

import constants from 'shared/constants';

import { cronJobTypeSchema } from '../cron';
import { executionSchema } from './tools/execution/schemas-execution';
import { toolSchema } from './tools/schemas-tools';

extendZodWithOpenApi(z);

/**
 * Persisted schedule status — mirrors node-cron user intent (`idle` | `stopped`), survives server restart.
 * Client maps `idle`/`running` to an "Active" label; `running` is runtime-only and not persisted.
 */
const jobScheduleStatusSchema = z.enum([constants.status.idle, constants.status.stopped]).openapi('JobScheduleStatus');

/**
 * A job schedule schema.
 */
const jobScheduleSchema = z
    .object({
        type: cronJobTypeSchema,
        // Enforce strict ISO 8601 timestamp with timezone (e.g. 2024-01-01T10:00:00Z or +02:00)
        // - Prevents locale-dependent parsing issues (e.g. DD/MM vs MM/DD)
        // - Guarantees timezone is explicitly defined (no implicit local time)
        startDate: z.string().datetime({ offset: true }),
        endDate: z.string().datetime({ offset: true }).nullable(),
        status: jobScheduleStatusSchema,
    })
    .openapi('JobSchedule');

/**
 * A job document schema.
 */
const jobDocumentSchema = z.object({
    _id: z.instanceof(ObjectId),
    userId: z.string(),
    name: z.string(),
    tools: z.array(toolSchema).min(1),
    schedule: jobScheduleSchema.nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    executions: z.array(executionSchema).optional(),
});

/**
 * A job schema.
 */
const jobSchema = jobDocumentSchema
    .omit({ _id: true })
    .extend({
        id: z.string(),
    })
    .openapi('Job');

/**
 * A delete job result schema.
 */
const deleteJobResultSchema = z
    .object({
        id: z.string(),
    })
    .openapi('DeleteJobResult');

export { jobScheduleSchema, jobScheduleStatusSchema, jobDocumentSchema, jobSchema, deleteJobResultSchema };
