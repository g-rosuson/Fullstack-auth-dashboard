---
name: background-jobs
description: Implement the full job lifecycle — transactional DB write, post-commit cron scheduling via req.context.scheduler, and immediate or scheduled execution via req.context.delegator. Covers create, update, and delete flows, the isCommitted transaction guard, and the scheduler/delegator ordering constraint. Use when adding or modifying job creation, update, deletion, or execution logic.
---

# Purpose

Implement job management endpoints that correctly combine MongoDB transactions, cron scheduling, and execution delegation in the required order.

# When To Use

- Implementing or modifying `createJob`, `updateJob`, or `deleteJob` controllers.
- Adding a new job type or tool to the delegation pipeline.
- Debugging scheduler/delegator state after failed or partial writes.
- Understanding the interaction between the transaction commit and side effects.

# Required Patterns

## Ordering constraint — commit before side effects

The critical invariant: **cron scheduling and job delegation MUST happen after `commitTransaction()`**, never before.

```
DB write → commitTransaction() → scheduler.schedule() → delegator.register() / delegate()
```

Reversing this order causes phantom cron jobs or delegated work for a job that was rolled back.

## Transaction + side effects pattern

```typescript
const session = req.context.db.transaction.startSession();
let isCommitted = false;

try {
    session.startTransaction();

    const created = await req.context.db.repository.jobs.create(payload, session);

    await session.commitTransaction();
    isCommitted = true;  // ← side effects permitted from this point

    // Respond first, then trigger side effects
    res.status(HttpStatusCode.CREATED).json({ success: true, data: created });

    if (created.schedule) {
        req.context.scheduler.schedule({ jobId: created.id, ... });
        req.context.delegator.register({ jobId: created.id, ... });
    } else {
        req.context.delegator.delegate({ jobId: created.id, ... });
    }

} catch (error) {
    if (!isCommitted) await session.abortTransaction();
    logger.error('Failed to create job', { error: error as Error });
    throw error;
} finally {
    await session.endSession();
}
```

## Scheduler — `req.context.scheduler`

| Method | When |
|---|---|
| `scheduler.schedule({ jobId, name, type, startDate, endDate })` | Register a cron task; destroys and recreates if already registered |
| `scheduler.getNextAndPreviousRun(jobId)` | Enrich response with `nextRun` / `lastRun` ISO strings |
| `scheduler.delete(jobId)` | Remove cron task when schedule is cleared or job is deleted |

## Delegator — `req.context.delegator`

| Method | When |
|---|---|
| `delegator.register({ jobId, userId, name, tools, scheduleType })` | Set up a scheduled job in `pendingJobs` (create, update, server startup) |
| `delegator.delegate({ jobId, userId, name, tools, scheduleType: null })` | Trigger immediate one-off execution |
| `delegator.removeJob(jobId)` | Tear down `pendingJobs`, `runningJobs`, and buffered SSE target events (delete, or update when schedule cleared) |
| `delegator.runningJobs` | Map of in-flight executions; guard update/delete with `runningJob?.userId === req.context.user.id` |

**`pendingJobs` lifecycle (delegator internals):** After `delegate()` finishes, entries are removed only for `scheduleType === 'once'` or `scheduleType === null`. Recurring jobs stay registered so later cron ticks can call `delegateScheduledJob` again. Do not clear recurring entries from controllers.

## Running-job guard

`runningJobs` is keyed by `jobId` only (not scoped to user). Before update/delete, block only when **this user** owns the running entry:

```typescript
const runningJob = req.context.delegator.runningJobs.get(id);
if (runningJob?.userId === req.context.user.id) {
    throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_UPDATED_WHILE_RUNNING);
    // or JOBS_CANNOT_BE_DELETED_WHILE_RUNNING
}
```

Cross-user access is enforced by the repository (`userId` on update/delete/get) → **404**, not by in-memory maps.

## Schedule enrichment

After scheduling, enrich the job response with runtime timing:

```typescript
const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(createdJob.id);

const schedule: EnrichedJobSchedule = {
    ...createdJob.schedule,
    nextRun: nextRun ? nextRun.toISOString() : null,
    lastRun: previousRun ? previousRun.toISOString() : null,
};
```

# Implementation Steps

## createJob

1. Start a session and transaction.
2. Build the `createJobPayload` including `userId: req.context.user.id`.
3. `await req.context.db.repository.jobs.create(payload, session)`.
4. `await session.commitTransaction(); isCommitted = true`.
5. If the job has a schedule: call `scheduler.schedule(...)`, enrich timing, respond, then `delegator.register(...)`.
6. If no schedule: respond, then `delegator.delegate(...)`.

## updateJob

1. Check running guard: `runningJob?.userId === req.context.user.id` — throw `BusinessLogicException` if true.
2. Start session, update in DB with `userId: req.context.user.id`, commit.
3. If new schedule: `scheduler.schedule(...)` (replaces old cron), enrich timing, respond, then `delegator.register(...)`.
4. If schedule cleared (`null`): after commit, `scheduler.delete(jobId)` and `delegator.removeJob(jobId)`; delegate immediately only if `req.body.runJob` is true.

## deleteJob

1. Check running guard: `runningJob?.userId === userId` — throw `BusinessLogicException` if true.
2. Delete from DB inside a transaction: `jobs.delete(id, userId, session)` then `commitTransaction()`.
3. **After commit only:** `scheduler.delete(id)` and `delegator.removeJob(id)`.
4. Respond with `{ id: result.id }`.

Ownership and “not found” come from `jobs.delete(id, userId)` — there is no automatic cleanup when the document is removed; controllers must explicitly tear down scheduler and delegator state after a successful delete.

```typescript
const runningJob = req.context.delegator.runningJobs.get(id);
if (runningJob?.userId === userId) {
    throw new BusinessLogicException(ErrorMessage.JOBS_CANNOT_BE_DELETED_WHILE_RUNNING);
}

const session = req.context.db.transaction.startSession();
let isCommitted = false;

try {
    session.startTransaction();
    const result = await req.context.db.repository.jobs.delete(id, userId, session);
    await session.commitTransaction();
    isCommitted = true;

    req.context.scheduler.delete(id);
    req.context.delegator.removeJob(id);

    res.status(HttpStatusCode.OK).json({ success: true, data: { id: result.id } });
} catch (error) {
    if (!isCommitted) await session.abortTransaction();
    logger.error('Failed to delete job', { error: error as Error });
    throw error;
} finally {
    await session.endSession();
}
```

# Examples

## Full createJob with schedule

```typescript
const createJob = async (req: Request<unknown, unknown, CreateJobInput>, res: Response) => {
    const session = req.context.db.transaction.startSession();
    let isCommitted = false;

    try {
        session.startTransaction();

        const payload = {
            userId: req.context.user.id,
            name: req.body.name,
            tools: req.body.tools.map(mappers.mapToIds),
            schedule: req.body.schedule,
            createdAt: new Date().toISOString(),
            updatedAt: null,
        };

        const created = await req.context.db.repository.jobs.create(payload, session);

        await session.commitTransaction();
        isCommitted = true;

        let schedule: EnrichedJobSchedule | null = null;

        if (created.schedule) {
            req.context.scheduler.schedule({
                jobId: created.id,
                name: created.name,
                type: created.schedule.type,
                startDate: created.schedule.startDate,
                endDate: created.schedule.endDate,
            });

            const { nextRun, previousRun } = req.context.scheduler.getNextAndPreviousRun(created.id);
            schedule = {
                ...created.schedule,
                nextRun: nextRun?.toISOString() ?? null,
                lastRun: previousRun?.toISOString() ?? null,
            };
        }

        res.status(HttpStatusCode.CREATED).json({ success: true, data: { ...created, schedule } });

        if (created.schedule) {
            req.context.delegator.register({
                jobId: created.id, userId: req.context.user.id,
                name: created.name, tools: created.tools,
                scheduleType: created.schedule.type,
            });
        } else {
            req.context.delegator.delegate({
                jobId: created.id, userId: req.context.user.id,
                name: created.name, tools: created.tools,
                scheduleType: null,
            });
        }

    } catch (error) {
        if (!isCommitted) await session.abortTransaction();
        logger.error('Failed to create job', { error: error as Error });
        throw error;
    } finally {
        await session.endSession();
    }
};
```

# Edge Cases

- **Job running guard on update/delete**: Use `runningJob?.userId === req.context.user.id`, not `runningJobs.has(id)` alone — otherwise another user's running job yields **422** instead of **404**.
- **`scheduler.schedule()` on update**: It destroys and recreates the cron task — safe to call even if a task already exists for that `jobId`.
- **Schedule cleared to `null` on update**: Call `scheduler.delete(jobId)` and `delegator.removeJob(jobId)`; delegate immediately only if `req.body.runJob` is true.
- **Delete in-memory cleanup**: Must run **after** `commitTransaction()` — scheduler/delegator are not transactional; failed DB delete must not tear down memory state.
- **Response before delegation**: `res.json()` is called before `delegator.delegate/register` on create/update to avoid blocking the HTTP response on long-running work.

# Anti-Patterns

- **Never** call `scheduler.schedule()` before `commitTransaction()` — creates phantom cron jobs.
- **Never** call `delegator.register/delegate()` before commit — causes execution against a possibly rolled-back job.
- **Never** skip the `isCommitted` guard in the `catch` block — double-aborts cause MongoDB errors.
- **Never** omit `session.endSession()` from `finally` — leaks MongoDB sessions.
- **Never** respond to the client after `delegator.delegate()` — delegation can be slow; respond first.
- **Never** call `scheduler.delete()` or `delegator.removeJob()` before a successful DB delete/update commit — leaves DB and memory out of sync on failure.
- **Never** assume delete cleanup happens in the repository — controllers must call `scheduler.delete` and `delegator.removeJob` explicitly.

# Validation Checklist

- [ ] Transaction started before any DB write
- [ ] `isCommitted = true` set immediately after `commitTransaction()`
- [ ] `scheduler.schedule()` called only after commit
- [ ] `delegator.register()` / `delegate()` called only after commit
- [ ] Response sent before delegation side effects
- [ ] `catch` block: `abortTransaction()` only when `!isCommitted`; `logger.error`; `throw error`
- [ ] `session.endSession()` in `finally`
- [ ] Running guard uses `runningJob?.userId === req.context.user.id` before update/delete
- [ ] Delete/update clear-schedule: `scheduler.delete` + `delegator.removeJob` only after successful DB commit
- [ ] All job payloads include `userId: req.context.user.id`
- [ ] **Never** mutate `delegator.runningJobs` or `delegator.pendingJobs` directly — use `removeJob`, `register`, `delegate` only
