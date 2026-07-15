import { Server } from 'http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MongoClientManager } from 'aop/db/mongo/client';
import { logger } from 'aop/logging';

import { ShutdownManager } from './server-shutdown-manager';

// Mock dependencies
vi.mock('aop/logging', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('aop/db/mongo/client', () => ({
    MongoClientManager: {
        getInstance: vi.fn(() => ({
            disconnect: vi.fn().mockResolvedValue(undefined),
        })),
    },
}));

describe('ShutdownManager', () => {
    let shutdownManager: ShutdownManager;
    let mockServer: Server;
    let originalProcessExit: typeof process.exit;
    let originalProcessOn: typeof process.on;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Mock process.exit to prevent actual process termination during tests
        originalProcessExit = process.exit;
        process.exit = vi.fn() as unknown as typeof process.exit;

        // Mock process.on to capture signal handlers
        originalProcessOn = process.on;
        process.on = vi.fn() as typeof process.on;

        // Create mock server
        mockServer = {
            close: vi.fn(callback => {
                callback();
            }),
        } as unknown as Server;

        // Get fresh instance
        shutdownManager = ShutdownManager.getInstance();
    });

    afterEach(() => {
        // Restore original functions
        process.exit = originalProcessExit;
        process.on = originalProcessOn;

        // Clear timers
        vi.clearAllTimers();
    });

    describe('getInstance', () => {
        it('should return the same singleton instance', async () => {
            const instance1 = ShutdownManager.getInstance();
            const instance2 = ShutdownManager.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should register signal handlers on first instantiation', () => {
            vi.waitFor(() => {
                expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
                expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
            });
        });
    });

    describe('registerServer', () => {
        it('should register the HTTP server', () => {
            shutdownManager.registerServer(mockServer);

            // The logger should be called with registration message
            expect(logger.info).toHaveBeenCalledWith('HTTP server registered with ShutdownManager');
        });
    });

    describe('initiateShutdown', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should perform graceful shutdown successfully', async () => {
            shutdownManager.registerServer(mockServer);

            await shutdownManager.initiateShutdown();

            // Verify server.close was called
            expect(mockServer.close).toHaveBeenCalled();

            vi.waitFor(() => {
                // Verify database disconnect was called
                const mockMongoManager = MongoClientManager.getInstance();
                expect(mockMongoManager.disconnect).toHaveBeenCalled();
            });
        });

        it('should ignore duplicate shutdown requests', async () => {
            shutdownManager.registerServer(mockServer);

            // Start first shutdown
            shutdownManager.initiateShutdown();

            // Try to start second shutdown immediately
            await shutdownManager.initiateShutdown();

            // Verify warning was logged for duplicate request
            expect(logger.warn).toHaveBeenCalledWith('Shutdown already in progress, ignoring duplicate request');
        });

        it('should handle shutdown without registered server', async () => {
            // Don't register any server
            await shutdownManager.initiateShutdown();

            // Should still complete shutdown process
            vi.waitFor(() => {
                const mockMongoManager = MongoClientManager.getInstance();
                expect(mockMongoManager.disconnect).toHaveBeenCalled();
            });
        });

        it('should handle HTTP server close error gracefully', async () => {
            const errorServer = {
                close: vi.fn(callback => {
                    callback(new Error('Server close failed'));
                }),
            } as unknown as Server;

            shutdownManager.registerServer(errorServer);

            await shutdownManager.initiateShutdown();

            // Should still exit with error code 1
            vi.waitFor(() => {
                expect(process.exit).toHaveBeenCalledWith(1);
            });
        });

        it('should trigger timeout if shutdown takes too long', async () => {
            const slowServer = {
                close: vi.fn(),
            } as unknown as Server;

            shutdownManager.registerServer(slowServer);

            // Start shutdown with short timeout
            shutdownManager.initiateShutdown({ timeoutMs: 1000, exitCode: 0 });

            // Fast-forward past timeout
            vi.advanceTimersByTime(1001);

            vi.waitFor(() => {
                // Should exit with code 1 due to timeout
                expect(process.exit).toHaveBeenCalledWith(1);

                // Verify timeout error was logged
                expect(logger.error).toHaveBeenCalledWith('Graceful shutdown timeout reached, forcing exit', {});
            });
        });
    });

    describe('signal handling', () => {
        it('should register signal handlers for SIGTERM and SIGINT', () => {
            vi.waitFor(() => {
                expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
                expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
            });
        });
    });
});
