import { Collection, Db, MongoClient, MongoError } from 'mongodb';

import { InternalException } from 'aop/exceptions/errors/system';
import { logger } from 'aop/logging';

import config from '../config';
import utils from './utils';

import { ErrorMessage } from 'shared/enums/error-messages';

import type { CollectionConfig } from '../shared/types';
import type { MongoClientOptions } from './types';

/**
 * MongoClientManager is a singleton class responsible for managing the MongoDB client connection.
 * It provides a scalable and testable way to share a MongoDB client across your application,
 * while also allowing injection of a custom client for testing.
 *
 * Features:
 * - Singleton pattern ensures one connection per application
 * - Automatic database ping for health verification
 * - Config-driven index creation at startup
 * - Support for custom client injection (useful for testing)
 */
export class MongoClientManager {
    private static instance: MongoClientManager;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private uri: string;
    private dbName: string;

    /**
     * Private constructor to enforce singleton pattern.
     * Only accessible through getInstance() method.
     * @param options MongoClientOptions containing URI and database name
     */
    private constructor(options: MongoClientOptions) {
        this.uri = options.uri;
        this.dbName = options.dbName;
    }

    /**
     * Returns the singleton instance of MongoClientManager.
     * Creates a new instance if one doesn't exist, otherwise returns the existing instance.
     * This ensures only one MongoDB connection manager exists per application.
     * @param options MongoClientOptions containing URI and database name
     * @returns The singleton MongoClientManager instance
     */
    static getInstance(options?: MongoClientOptions): MongoClientManager {
        if (!this.instance && !options) {
            throw new InternalException(ErrorMessage.MONGO_CLIENT_MANAGER_INSTANCE_NOT_FOUND);
        }

        if (!this.instance && options) {
            this.instance = new MongoClientManager(options);
        }

        return this.instance;
    }

    /**
     * Connects to MongoDB and sets up the client and database instance.
     * This method is idempotent - if already connected, returns the existing database instance.
     * Performs the following operations:
     * 1. Establishes MongoDB client connection (or uses provided custom client)
     * 2. Selects the target database
     * 3. Pings the database to verify connectivity
     * 4. Creates indexes as specified in configuration
     *
     * @param customClient Optional custom MongoClient for testing purposes
     * @returns Promise resolving to the MongoDB Db instance
     * @throws Error if connection fails or database ping fails
     */
    async connect(customClient?: MongoClient) {
        // Return existing connection if already established
        if (this.db) {
            return this.db;
        }

        // Use custom client if provided (typically for testing)
        if (customClient) {
            this.client = customClient;
        }

        // Create new MongoDB client if none exists
        if (!this.client) {
            this.client = new MongoClient(this.uri);
            await this.client.connect();
        }

        // Select the target database
        this.db = this.client.db(this.dbName);

        // Initialize database (ping + create indexes)
        await this.initializeDb(this.db);

        return this.db;
    }

    /**
     * Disconnects and cleans up the MongoDB client connection.
     * Properly closes the client connection and resets internal state.
     * This method is safe to call multiple times - it will only disconnect if connected.
     *
     * @returns Promise that resolves when disconnection is complete
     */
    async disconnect() {
        if (this.client) {
            await this.client.close();

            this.client = null;
            this.db = null;
        }
    }

    /**
     * Starts a new MongoDB session if the client is connected.
     * @throws InternalException if the client is not connected
     * @returns The MongoDB session
     */
    public startSession() {
        if (!this.client) {
            throw new InternalException(ErrorMessage.MONGO_CLIENT_NOT_CONNECTED);
        }

        return this.client.startSession();
    }

    /**
     * Initializes the database connection by verifying connectivity and ensuring required indexes exist.
     *
     * This method performs two critical operations:
     * 1. **Health Check**: Pings the database to verify it's responsive and accessible
     * 2. **Index Management**: Creates or updates indexes for collections marked in configuration
     *
     * Index management behavior:
     * - Drops legacy indexes listed in `dropLegacyIndexes` before managing the configured index
     * - Checks if each required index already exists with correct options (unique, key shape)
     * - If index exists with correct options: skips creation (idempotent)
     * - If index exists with different options: drops and recreates with correct options
     * - If index doesn't exist: creates it with the specified configuration
     *
     * All indexes use explicit names following MongoDB's pattern (e.g. `email_1`, `userId_1_name_1`)
     * to ensure predictable behavior and avoid conflicts.
     *
     * @param db The MongoDB database instance to initialize
     * @throws Error if database ping fails or index operations fail unrecoverably
     */
    private async initializeDb(db: Db) {
        // Verify database connectivity
        logger.info('Pinging database');

        await db.command({ ping: 1 });

        logger.info('Database pinged');

        // Create or update indexes for configured collections
        logger.info('Indexing collections');

        const collections = Object.values(config.db.collection).filter(item => item.index);

        for (const item of collections) {
            const indexName = utils.buildIndexName(item.indexKeys);
            const collection = db.collection(item.name);

            // Drop legacy indexes if they exist
            if (item.dropLegacyIndexes.length) {
                for (const legacyIndexName of item.dropLegacyIndexes) {
                    try {
                        await collection.dropIndex(legacyIndexName);
                        logger.info(`Dropped legacy index ${legacyIndexName} for ${item.name}`);
                    } catch (dropError) {
                        logger.warn(
                            `Could not drop legacy index ${legacyIndexName} for ${item.name} (may not exist): ${(dropError as Error).message}`
                        );
                    }
                }
            }

            try {
                // Check if index already exists
                const existingIndexes = await collection.indexes();
                const existingIndex = existingIndexes.find(idx => idx.name === indexName);
                if (existingIndex) {
                    const existingKey = existingIndex.key;
                    const configuredKey = item.indexKeys;

                    const hasSameFieldCount = Object.keys(configuredKey).length === Object.keys(existingKey).length;
                    const hasSameFieldsAndOrder = Object.entries(configuredKey).every(
                        ([field, order]) => existingKey[field] === order
                    );
                    const hasSameUniqueOption = existingIndex.unique === item.unique;

                    const areIndexesTheSame = hasSameUniqueOption && hasSameFieldCount && hasSameFieldsAndOrder;
                    if (areIndexesTheSame) {
                        // Index exists with correct options - no action needed
                        logger.info(`Index ${indexName} already exists with correct options for ${item.name}`);
                        continue;
                    }

                    // Index exists with different options - recreate it
                    logger.warn(
                        `Index ${indexName} exists with different options for ${item.name}. Recreating with correct options.`
                    );

                    await this.rotateIndex(collection, item, indexName);
                } else {
                    // Index doesn't exist - create it
                    await collection.createIndex(item.indexKeys, { unique: item.unique, name: indexName });
                    const existingIndexes = await collection.indexes();
                    console.log('created indexes', existingIndexes);
                    logger.info(`Created index ${indexName} for ${item.name}`);
                }
            } catch (error) {
                const mongoError = error as MongoError;

                // Handle race condition: index was created between our check and create attempt
                if (mongoError.code === 86) {
                    logger.warn(
                        `Index conflict detected for ${item.name} during creation. Recreating with correct options.`
                    );

                    await this.rotateIndex(collection, item, indexName);
                } else {
                    // Re-throw unexpected errors
                    throw error;
                }
            }
        }

        logger.info('Collections indexed');
    }

    /**
     * Drops and recreates an index with the specified configuration.
     * Handles cases where the index might not exist during drop (already dropped or doesn't exist).
     *
     * @param collection The MongoDB collection instance
     * @param item The collection configuration item containing index settings
     * @param indexName The name of the index to recreate
     */
    private async rotateIndex(collection: Collection, item: CollectionConfig, indexName: string) {
        try {
            await collection.dropIndex(indexName);
        } catch (dropError) {
            // Index might already be dropped or not exist - continue with recreation
            logger.warn(`Could not drop index ${indexName} (may not exist): ${(dropError as Error).message}`);
        }

        await collection.createIndex(item.indexKeys, { unique: item.unique, name: indexName });

        logger.info(`Successfully recreated index ${indexName} for ${collection.collectionName}`);
    }
}
