import { Server } from 'http';

import { MongoClientManager } from 'aop/db/mongo/client';
import { logger } from 'aop/logging';

/**
 * Configuration options for shutdown behavior.
 */
interface ShutdownOptions {
    /** Maximum time to wait for graceful shutdown in milliseconds (default: 30000) */
    timeoutMs: number;
    /** Exit code to use when shutting down (default: 0) */
    exitCode: number;
}

/**
 * Manages graceful shutdown of the application.
 *
 * This singleton class handles SIGTERM and SIGINT signals to ensure
 * the application shuts down cleanly by:
 * 1. Stopping new HTTP requests from being accepted
 * 2. Closing database connections
 * 3. Exiting the process with appropriate exit code
 *
 * Features:
 * - Singleton pattern ensures consistent shutdown behavior
 * - Configurable timeout to prevent indefinite hangs
 * - Comprehensive logging for observability
 * - Prevents duplicate shutdown attempts
 * - Handles both SIGTERM and SIGINT signals
 */
export class ShutdownManager {
    private static instance: ShutdownManager;
    private server: Server | null = null;
    private isShuttingDown = false;
    private shutdownTimeout: NodeJS.Timeout | null = null;

    private constructor() {
        this.registerSignalHandlers();
    }

    /**
     * Returns the singleton instance of ShutdownManager.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton ShutdownManager instance
     */
    static getInstance(): ShutdownManager {
        if (!this.instance) {
            this.instance = new ShutdownManager();
        }

        return this.instance;
    }

    /**
     * Registers the Express server instance for graceful shutdown.
     * The server will be closed when shutdown is initiated.
     *
     * @param server The Express HTTP server instance
     */
    registerServer(server: Server): void {
        this.server = server;
        logger.info('HTTP server registered with ShutdownManager');
    }

    /**
     * Initiates graceful shutdown of the application.
     * This method can be called manually or will be triggered by signal handlers.
     *
     * Shutdown sequence:
     * 1. Stop accepting new HTTP requests
     * 2. Close database connections
     * 3. Exit process with specified code
     *
     * @param options Configuration for shutdown behavior
     */
    async initiateShutdown(options: ShutdownOptions = { timeoutMs: 30000, exitCode: 0 }): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress, ignoring duplicate request');
            return;
        }

        this.isShuttingDown = true;
        const { timeoutMs, exitCode } = options;

        logger.info('Initiating graceful shutdown');

        // Set timeout to force exit if graceful shutdown hangs
        this.shutdownTimeout = setTimeout(() => {
            logger.error('Graceful shutdown timeout reached, forcing exit', {});
            process.exit(1);
        }, timeoutMs);

        try {
            // Step 1: Stop accepting new HTTP requests
            if (this.server) {
                logger.info('Stopping HTTP server');
                await this.stopHttpServer();
                logger.info('HTTP server stopped successfully');
            }

            // Step 2: Close database connections
            logger.info('Closing database connections');
            await this.closeDatabaseConnections();
            logger.info('Database connections closed successfully');

            // Clear timeout since we completed gracefully
            if (this.shutdownTimeout) {
                clearTimeout(this.shutdownTimeout);
                this.shutdownTimeout = null;
            }

            logger.info('Graceful shutdown completed successfully');

            // Exit process
            process.exit(exitCode);
        } catch (error) {
            logger.error('Error during graceful shutdown', { error: error as Error });
            process.exit(1);
        }
    }

    /**
     * Registers signal handlers for SIGTERM and SIGINT.
     * These signals will trigger graceful shutdown.
     */
    private registerSignalHandlers(): void {
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

        signals.forEach(signal => {
            process.on(signal, () => {
                logger.info(`Received ${signal}, initiating graceful shutdown`);
                this.initiateShutdown();
            });
        });

        logger.info('Signal handlers registered for graceful shutdown');
    }

    /**
     * Stops the HTTP server gracefully.
     * Waits for existing connections to close before resolving.
     */
    private async stopHttpServer(): Promise<void> {
        if (!this.server) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.server!.close(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Closes all database connections.
     * Disconnects from MongoDB and cleans up resources.
     */
    private async closeDatabaseConnections(): Promise<void> {
        try {
            const mongoManager = MongoClientManager.getInstance();
            await mongoManager.disconnect();
        } catch (error) {
            logger.warn('Error closing database connections', { error: error as Error });
        }
    }
}
