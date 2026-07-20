import { ObjectId } from 'mongodb';

import { MongoClientManager } from 'aop/db/mongo/client';
import config from 'aop/db/mongo/config';

import type { JobSchedule } from 'shared/types/jobs';

/**
 * Patches persisted schedule fields so past-date activate/retry scenarios can be exercised
 * without waiting for real wall-clock expiry (create validation rejects past start dates).
 */
async function updatePersistedJobSchedule(jobId: string, schedule: JobSchedule): Promise<void> {
    const db = await MongoClientManager.getInstance().connect();
    const result = await db
        .collection(config.db.collection.jobs.name)
        .updateOne({ _id: new ObjectId(jobId) }, { $set: { schedule } });
    expect(result.matchedCount).toBe(1);
}

export { updatePersistedJobSchedule };
