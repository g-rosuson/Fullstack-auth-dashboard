import { MongoClient, MongoError } from 'mongodb';

import dbConfig from 'aop/db/mongo/config';

import utils from './utils';

import type { CollectionConfig } from '../shared/types';
import type { MongoClientOptions } from './types';

import { MongoClientManager } from './';

/**
 * Testing Strategy for MongoClientManager
 *
 * This test suite tests a singleton class that manages MongoDB connections.
 * Key testing considerations:
 *
 * 1. SINGLETON PATTERN: The class maintains one instance across the application.
 *    - Tests must reset the singleton state when testing different scenarios
 *    - Use (MongoClientManager as unknown as { instance: MongoClientManager | null }).instance = null
 *
 * 2. CONNECTION STATE: The class maintains internal connection state (client, db).
 *    - Once connected, subsequent connect() calls return existing connection
 *    - disconnect() resets internal state, allowing fresh connections
 *
 * 3. CUSTOM CLIENT INJECTION: Designed for testing isolation.
 *    - Allows injecting mock clients instead of real MongoDB connections
 *    - Tests both paths: with and without custom client
 *
 * 4. MOCK STRATEGY: Global mocks for MongoDB dependencies.
 *    - Mock MongoClient constructor to avoid real database connections
 *    - Mock Db methods (command, collection) to test initialization behavior
 *    - Use mockRejectedValueOnce() for error scenario testing
 *
 * 5. DYNAMIC COLLECTION HANDLING: Tests are collection-agnostic and read from config.
 *    - Tests automatically adapt to any number of collections in the configuration
 *    - Helper functions generate mocks based on actual config values
 *    - No need to update tests when adding/removing collections from config
 *    - Ensures tests remain maintainable and scalable as collections grow
 */

// Mock mongodb - collection methods
const mockCreateIndex = vi.fn().mockResolvedValue('ok');
const mockDropIndex = vi.fn().mockResolvedValue(undefined);
const mockIndexes = vi.fn().mockResolvedValue([]);

// Create a factory function for collection mocks so each collection can have its own mock state
const createMockCollection = (collectionName: string) => ({
    createIndex: mockCreateIndex,
    dropIndex: mockDropIndex,
    indexes: mockIndexes,
    collectionName,
});

const mockCollection = vi.fn((name: string) => createMockCollection(name));
const mockCommand = vi.fn().mockResolvedValue({});
const mockDb = { command: mockCommand, collection: mockCollection };

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDbFn = vi.fn(() => mockDb);
const mockClose = vi.fn().mockResolvedValue(undefined);

const mockClient = { connect: mockConnect, db: mockDbFn, close: mockClose };

vi.mock('mongodb', async importOriginal => {
    const actual = await importOriginal();
    return {
        ...(actual || {}),
        MongoClient: vi.fn(() => mockClient),
    };
});

describe('MongoClientManager', () => {
    const testOptions: MongoClientOptions = {
        uri: 'mongodb://localhost:27017/test',
        dbName: 'test-database',
    };

    /**
     * Helper: Get collections that should be indexed from configuration.
     * Dynamically reads from config to ensure tests work with any number of collections.
     *
     * @returns Array of collection configuration items that have index: true
     */
    const getIndexedCollections = (): CollectionConfig[] => {
        return Object.values(dbConfig.db.collection).filter(item => item.index);
    };

    /**
     * Helper: Generate mock index response for a collection based on configuration.
     */
    const createMockIndex = (
        item: Pick<CollectionConfig, 'indexKeys' | 'unique'>,
        exists: boolean,
        correctUnique: boolean = true,
        correctKeys: boolean = true
    ) => {
        if (!exists) return [];

        return [
            {
                name: utils.buildIndexName(item.indexKeys),
                key: correctKeys ? item.indexKeys : { wrongField: 1 },
                unique: correctUnique ? item.unique : !item.unique,
            },
        ];
    };

    describe('getInstance()', () => {
        // Get singleton instance - this will be the same unless explicitly reset
        const dbInstance = MongoClientManager.getInstance(testOptions);

        it('should create a new mongo client instance on first call', () => {
            expect(dbInstance).toBeInstanceOf(MongoClientManager);
        });

        it('should return the same instance on subsequent calls', () => {
            const secondInstance = MongoClientManager.getInstance(testOptions);
            expect(dbInstance).toBe(secondInstance);
        });
    });

    describe('connect()', () => {
        // Get singleton instance for connect tests
        // Note: This instance may already have a connection from previous tests
        const dbInstance = MongoClientManager.getInstance(testOptions);

        it('should call connect and make a new db connection', async () => {
            const db = await dbInstance.connect();
            expect(mockConnect).toHaveBeenCalled();
            expect(db).toBe(mockDb);
        });

        it('should call connect() and return the same db connection on subsequent calls', async () => {
            // Test idempotent behavior: subsequent calls return existing connection
            const secondDb = await dbInstance.connect();
            expect(mockConnect).toHaveBeenCalled();
            expect(secondDb).toBe(mockDb);
        });

        it('should use the provided custom client and create a new db connection', async () => {
            // CRITICAL: Reset singleton to test custom client injection
            // Without reset, the existing client is used
            (MongoClientManager as unknown as { instance: MongoClientManager | null }).instance = null;

            const newDbInstance = MongoClientManager.getInstance(testOptions);
            const customClient = { db: vi.fn().mockReturnValue(mockDb) } as unknown as MongoClient;
            const db = await newDbInstance.connect(customClient);

            expect(db).toBe(mockDb);
        });

        it('should call initializeDb() and create indexes for the collections', async () => {
            // Test contract: connect() should create necessary indexes
            // This verifies the public API behavior, not implementation details
            expect(mockCreateIndex).toHaveBeenCalled();
        });

        it('should call initializeDb() and ping the database', async () => {
            // Test contract: connect() should ping database for health check
            // This verifies the public API behavior, not implementation details
            expect(mockCommand).toHaveBeenCalled();
        });
    });

    describe('connect(): error handling', () => {
        let dbInstance: MongoClientManager;

        beforeEach(() => {
            // CRITICAL: Reset singleton before each error test
            // This ensures each test goes through the full connection process
            // where errors can occur, rather than reusing existing connections
            (MongoClientManager as unknown as { instance: MongoClientManager | null }).instance = null;

            dbInstance = MongoClientManager.getInstance(testOptions);
        });

        it('should throw error when client connection fails', async () => {
            const errorMessage = 'Connection failed';

            // Override mock for this test only - mockRejectedValueOnce() reverts after use
            mockConnect.mockRejectedValueOnce(new Error(errorMessage));

            await expect(dbInstance.connect()).rejects.toThrow(errorMessage);
        });

        it('should throw error when database ping fails', async () => {
            const errorMessage = 'Ping failed';

            // Override mock for this test only - mockRejectedValueOnce() reverts after use
            mockCommand.mockRejectedValueOnce(new Error(errorMessage));

            await expect(dbInstance.connect()).rejects.toThrow(errorMessage);
        });

        it('should throw error when index creation fails', async () => {
            const errorMessage = 'Index creation failed';

            // Override mock for this test only - mockRejectedValueOnce() reverts after use
            mockCreateIndex.mockRejectedValueOnce(new Error(errorMessage));

            await expect(dbInstance.connect()).rejects.toThrow(errorMessage);
        });
    });

    /**
     * Index Management Tests
     *
     * These tests verify the index initialization logic for all configured collections.
     * Tests are dynamic and automatically adapt to any number of collections in the config.
     * Each test scenario is verified across all collections that require indexing.
     */
    describe('initializeDb(): index management', () => {
        let dbInstance: MongoClientManager;

        beforeEach(() => {
            // Reset singleton before each test to ensure clean state
            (MongoClientManager as unknown as { instance: MongoClientManager | null }).instance = null;
            dbInstance = MongoClientManager.getInstance(testOptions);

            // Reset all mocks
            vi.clearAllMocks();
        });

        it('should create index when it does not exist', async () => {
            // Mock: no indexes exist for any collections
            mockIndexes.mockImplementation(() => Promise.resolve([]));

            await dbInstance.connect();

            // Verify createIndex was called for all configured collections
            expect(mockCreateIndex).toHaveBeenCalled();
            expect(mockDropIndex).toHaveBeenCalledWith('name_1');
        });

        it('should skip creating index when it already exists with correct options', async () => {
            // Mock: indexes exist with correct unique options for all configured collections
            const collections = getIndexedCollections();
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                // Return mock index that exists with correct options matching config
                return Promise.resolve(createMockIndex(item, true, true));
            });

            await dbInstance.connect();

            // Verify createIndex was not called for any collection (all indexes already exist correctly)
            expect(mockCreateIndex).not.toHaveBeenCalled();
            expect(mockDropIndex).toHaveBeenCalledWith('name_1');
        });

        it('should recreate index when it exists with wrong unique option', async () => {
            // Mock: first collection index exists but with wrong unique option (conflict scenario)
            // Other collections don't have indexes yet
            const collections = getIndexedCollections();
            const firstCollection = collections[0];
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                if (callCount === 1) {
                    // First collection - index exists with wrong unique option (should trigger recreation)
                    return Promise.resolve(createMockIndex(item, true, false));
                } else {
                    // Other collections - no index exists yet
                    return Promise.resolve(createMockIndex(item, false));
                }
            });

            await dbInstance.connect();

            // Verify dropIndex and createIndex were called for first collection with conflict
            expect(mockDropIndex).toHaveBeenCalledWith(utils.buildIndexName(firstCollection.indexKeys));
            expect(mockCreateIndex).toHaveBeenCalledWith(firstCollection.indexKeys, {
                unique: firstCollection.unique,
                name: utils.buildIndexName(firstCollection.indexKeys),
            });
        });

        it('should handle race condition when index is created between check and create', async () => {
            // Mock: Simulates race condition where index is created between our check and create attempt
            // First collection's createIndex throws code 86 (IndexKeySpecsConflict)
            // Other collections succeed normally
            const collections = getIndexedCollections();
            const firstCollection = collections[0];
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                // No indexes exist initially (but one gets created concurrently)
                return Promise.resolve(createMockIndex(item, false));
            });

            // Only the first createIndex call should fail with conflict (simulating race condition)
            let createIndexCallCount = 0;
            mockCreateIndex.mockImplementation(() => {
                createIndexCallCount++;
                if (createIndexCallCount === 1) {
                    // First createIndex call fails with conflict (code 86 = IndexKeySpecsConflict)
                    const mongoError = new Error('Index conflict') as MongoError;
                    mongoError.code = 86;
                    return Promise.reject(mongoError);
                }
                // Subsequent calls succeed (after conflict resolution)
                return Promise.resolve('ok');
            });

            await dbInstance.connect();

            // Verify conflict was handled: drop existing index, then recreate
            // First collection: 1 failed attempt + 1 successful recreation after drop = 2 calls
            // Other collections: 1 successful creation each
            const expectedCalls = 1 + 1 + (collections.length - 1); // Failed once, recreated once, other collections once each
            expect(mockDropIndex).toHaveBeenCalledWith(utils.buildIndexName(firstCollection.indexKeys));
            expect(mockCreateIndex).toHaveBeenCalledTimes(expectedCalls);
        });

        it('should handle dropIndex failure gracefully when recreating index', async () => {
            // Mock: First collection index exists with wrong options (needs recreation)
            // But dropIndex fails (index may have been dropped concurrently or doesn't exist)
            const collections = getIndexedCollections();
            const firstCollection = collections[0];
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                if (callCount === 1) {
                    // First collection - index exists with wrong unique option (needs recreation)
                    return Promise.resolve(createMockIndex(item, true, false));
                } else {
                    // Other collections - no index exists yet
                    return Promise.resolve(createMockIndex(item, false));
                }
            });

            // dropIndex fails (index may have been dropped concurrently or doesn't exist)
            mockDropIndex.mockRejectedValueOnce(new Error('Index not found'));

            await dbInstance.connect();

            // Verify it continued with recreation despite dropIndex failure
            // This ensures resilience when index state changes between check and drop
            expect(mockDropIndex).toHaveBeenCalledWith(utils.buildIndexName(firstCollection.indexKeys));
            expect(mockCreateIndex).toHaveBeenCalled(); // Should still create index
        });

        it('should throw error when index creation fails with non-conflict error', async () => {
            // Mock: no indexes exist for all configured collections
            mockIndexes.mockImplementation(() => Promise.resolve([]));

            // createIndex fails with non-conflict error on first call
            // This tests that non-conflict errors are properly propagated
            const errorMessage = 'Database connection lost';
            mockCreateIndex.mockRejectedValueOnce(new Error(errorMessage));

            await expect(dbInstance.connect()).rejects.toThrow(errorMessage);
        });

        it('should process multiple collections with different index states', async () => {
            // Mock: Simulates mixed state where some collections have indexes and others don't
            // First collection has correct index (should be skipped), others need creation
            const collections = getIndexedCollections();
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                if (callCount === 1) {
                    // First collection - index exists correctly (should be skipped)
                    return Promise.resolve(createMockIndex(item, true, true));
                } else {
                    // Other collections - no index exists (should be created)
                    return Promise.resolve(createMockIndex(item, false));
                }
            });

            await dbInstance.connect();

            // Verify: All collections checked, but only collections without indexes were created
            expect(mockIndexes).toHaveBeenCalledTimes(collections.length);
            expect(mockCreateIndex).toHaveBeenCalledTimes(collections.length - 1); // Only for collections without index
        });

        it('should use explicit index names following MongoDB pattern', async () => {
            // Mock: No indexes exist for any configured collections
            const collections = getIndexedCollections();
            mockIndexes.mockImplementation(() => Promise.resolve([]));

            await dbInstance.connect();

            // Verify all indexes use explicit names following MongoDB pattern: {field}_{order}
            // This ensures predictable index names and avoids auto-generated name conflicts
            collections.forEach(item => {
                expect(mockCreateIndex).toHaveBeenCalledWith(
                    item.indexKeys,
                    expect.objectContaining({
                        name: utils.buildIndexName(item.indexKeys),
                    })
                );
            });
        });

        it('should drop legacy indexes before creating the configured index', async () => {
            const collections = getIndexedCollections();
            const jobsCollection = collections.find(item => item.dropLegacyIndexes?.includes('name_1'));

            expect(jobsCollection).toBeDefined();
            expect(jobsCollection?.dropLegacyIndexes).toContain('name_1');

            mockIndexes.mockImplementation(() => Promise.resolve([]));

            await dbInstance.connect();

            expect(mockDropIndex).toHaveBeenCalledWith('name_1');
        });

        it('should recreate index when it exists with wrong key shape', async () => {
            const collections = getIndexedCollections();
            const firstCollection = collections[0];
            let callCount = 0;

            mockIndexes.mockImplementation(() => {
                const item = collections[callCount];
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(createMockIndex(item, true, true, false));
                }

                return Promise.resolve(createMockIndex(item, false));
            });

            await dbInstance.connect();

            expect(mockDropIndex).toHaveBeenCalledWith(utils.buildIndexName(firstCollection.indexKeys));
            expect(mockCreateIndex).toHaveBeenCalledWith(firstCollection.indexKeys, {
                unique: firstCollection.unique,
                name: utils.buildIndexName(firstCollection.indexKeys),
            });
        });
    });

    describe('disconnect()', () => {
        let dbInstance: MongoClientManager;

        beforeEach(() => {
            // Reset singleton to ensure clean state for disconnect tests
            // This allows testing both connected and disconnected scenarios
            (MongoClientManager as unknown as { instance: MongoClientManager | null }).instance = null;

            dbInstance = MongoClientManager.getInstance(testOptions);
        });

        afterEach(() => {
            // Clear mock call history between tests to prevent interference
            vi.clearAllMocks();
        });

        it('should call disconnect() and close the client', async () => {
            // Test disconnect when connected: should call close() and reset internal state
            await dbInstance.connect();
            await dbInstance.disconnect();
            expect(mockClose).toHaveBeenCalled();
        });

        it('should not call disconnect() when client is not connected', async () => {
            // Test disconnect when not connected: should be safe to call multiple times
            await dbInstance.disconnect();
            expect(mockClose).not.toHaveBeenCalled();
        });
    });

    describe('disconnect(): error handling', () => {
        it('should throw error when close() fails', async () => {
            const dbInstance = MongoClientManager.getInstance(testOptions);

            // Re-connect to client
            await dbInstance.connect();

            const errorMessage = 'Failed to disconnect';

            // Override mock for this test only - mockRejectedValueOnce() reverts after use
            mockClose.mockRejectedValueOnce(new Error(errorMessage));

            await expect(dbInstance.disconnect()).rejects.toThrow(errorMessage);
        });
    });
});
