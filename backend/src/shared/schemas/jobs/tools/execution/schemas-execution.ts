import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import constants from 'shared/constants';

import {
    executionEmailToolSchema,
    executionEmailToolTargetResultSchema,
    executionEmailToolTargetSchema,
} from './schemas-execution-email-tool';
import { executionScraperToolTargetResultSchema } from './schemas-execution-scraper-tool';
import { executionScraperToolSchema, executionScraperToolTargetSchema } from './schemas-execution-scraper-tool';
import { cronJobTypeSchema } from 'shared/schemas/cron';

extendZodWithOpenApi(z);

/**
 * An execution schedule schema.
 */
const executionScheduleSchema = z
    .object({
        type: cronJobTypeSchema.nullable(),
        delegatedAt: z.string().datetime({ offset: true }),
        finishedAt: z.string().datetime({ offset: true }).nullable(),
        cancelledAt: z.string().datetime({ offset: true }).nullable(),
    })
    .openapi('ExecutionSchedule');

/**
 * An execution tool target schema.
 * @note we use a union instead of a discriminated union, because the tool target name "target"
 * needs to be a .literal() or .enum().
 */
const executionToolTargetSchema = z
    .union([executionScraperToolTargetSchema, executionEmailToolTargetSchema])
    .openapi('ExecutionToolTarget');

/**
 * An execution tool schema.
 */
const executionToolSchema = z
    .discriminatedUnion('type', [executionScraperToolSchema, executionEmailToolSchema])
    .openapi('ExecutionTool');

/**
 * An execution tool target result schema.
 */
const exectutionToolTargetResultSchema = z
    .union([executionScraperToolTargetResultSchema, executionEmailToolTargetResultSchema])
    .openapi('ExecutionToolTargetResult');

/**
 * Execution outcome status. Optional so legacy documents without `status` still
 * validate on read (treat missing as completed at the consumer).
 */
const executionStatusSchema = z
    .enum([constants.status.execution.completed, constants.status.execution.cancelled])
    .openapi('ExecutionStatus');

/**
 * An execution schema.
 * `tools` may be empty when a run is cancelled before any tool completes.
 */
const executionSchema = z
    .object({
        schedule: executionScheduleSchema,
        tools: z.array(executionToolSchema),
        executionId: z.string(),
        status: executionStatusSchema.optional(),
    })
    .openapi('Execution');

export {
    executionSchema,
    executionStatusSchema,
    executionToolTargetSchema,
    executionToolSchema,
    exectutionToolTargetResultSchema,
    executionScheduleSchema,
};
