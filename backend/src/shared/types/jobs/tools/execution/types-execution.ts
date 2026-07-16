import { z } from 'zod';

import { CronJobType } from 'shared/types/cron';

import {
    executionStatusSchema,
    executionToolSchema,
    executionToolTargetSchema,
} from 'shared/schemas/jobs/tools/execution/schemas-execution';

/**
 * An union type of all execution tool targets.
 */
type ExecutionToolTarget = z.infer<typeof executionToolTargetSchema>;

/**
 * An execution tool.
 */
type ExecutionTool = z.infer<typeof executionToolSchema>;

/**
 * An execution schedule.
 */
type ExecutionSchedule = {
    type: CronJobType | null;
    delegatedAt: string;
    finishedAt: string | null;
};

/**
 * Execution outcome status written by the Delegator.
 */
type ExecutionStatus = z.infer<typeof executionStatusSchema>;

/**
 * A execution payload.
 * `status` is always set on write; persisted documents may omit it (legacy).
 */
interface ExecutionPayload {
    executionId: string;
    jobId: string;
    schedule: ExecutionSchedule;
    tools: ExecutionTool[];
    status: ExecutionStatus;
}

export type { ExecutionToolTarget, ExecutionPayload, ExecutionTool, ExecutionSchedule, ExecutionStatus };
