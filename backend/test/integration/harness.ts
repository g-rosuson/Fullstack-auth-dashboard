import request from 'supertest';

import { MongoClientManager } from 'aop/db/mongo/client';
import { Scheduler } from 'aop/scheduler';

import type { Express } from 'express';

import server from 'server';

/**
 * Builds the real Express app (Mongo connect, indexes, job reschedule, middleware, routes).
 */
const initServer = async (): Promise<Express> => {
    console.log('[DBG:HARNESS] initServer: calling server.init()');
    const app = await server.init();
    console.log('[DBG:HARNESS] initServer: server.init() resolved');
    return app;
};

/**
 * Deletes all cron jobs.
 */
const deleteCronJobs = async (): Promise<void> => {
    const scheduler = Scheduler.getInstance();
    const jobIds = scheduler.allJobs.map(j => j.jobId);
    console.log('[DBG:HARNESS] deleteCronJobs: clearing', { count: jobIds.length, jobIds });
    for (const job of scheduler.allJobs) {
        scheduler.delete(job.jobId);
    }
};

/**
 * Clears all collections.
 */
const clearCollections = async (): Promise<void> => {
    const manager = MongoClientManager.getInstance();
    const db = await manager.connect();
    const collections = await db.collections();

    const beforeSnapshot = await Promise.all(
        collections.map(async c => ({
            name: c.collectionName,
            indexes: await c.indexes(),
        }))
    );
    console.log('[DBG:HARNESS] clearCollections: BEFORE deleteMany', {
        dbName: db.databaseName,
        collections: beforeSnapshot,
    });

    await Promise.all(collections.map(collection => collection.deleteMany({})));

    const afterSnapshot = await Promise.all(
        collections.map(async c => ({
            name: c.collectionName,
            indexes: await c.indexes(),
        }))
    );
    console.log('[DBG:HARNESS] clearCollections: AFTER deleteMany', {
        dbName: db.databaseName,
        collections: afterSnapshot,
    });
};

/**
 * Disconnects from MongoDB.
 */
const disconnectMongo = async (): Promise<void> => {
    console.log('[DBG:HARNESS] disconnectMongo: calling manager.disconnect()');
    const manager = MongoClientManager.getInstance();
    await manager.disconnect();
    console.log('[DBG:HARNESS] disconnectMongo: done');
};

/**
 * Supertest client bound to `app` (no listening port).
 */
const getAgent = (app: Express) => request(app);

export { initServer, getAgent, deleteCronJobs, clearCollections, disconnectMongo };
