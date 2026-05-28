import { Server } from 'http';

import { logger } from 'aop/logging';

import server from 'server';
import { ShutdownManager } from 'server/server-shutdown-manager';

const run = async (): Promise<void> => {
    let httpServer: Server | null = null;

    try {
        const app = await server.init();

        httpServer = app.listen(1000, '0.0.0.0', () => {
            // BEGIN E2E-DEBUG — remove after CI root-cause is fixed
            const boundAddress = httpServer?.address();
            logger.info(
                `[E2E-DEBUG] HTTP server bound address: ${JSON.stringify({
                    boundAddress: boundAddress ?? null,
                    pid: process.pid,
                    ppid: process.ppid,
                })}`
            );
            // END E2E-DEBUG
            logger.info(`🚀 Server listening on port ${1000}`);
        });

        // BEGIN E2E-DEBUG — remove after CI root-cause is fixed
        httpServer.on('error', error => {
            logger.error('[E2E-DEBUG] HTTP server listen error', { error: error as Error });
        });
        // END E2E-DEBUG

        // Register server with ShutdownManager
        const shutdownManager = ShutdownManager.getInstance();
        shutdownManager.registerServer(httpServer);
    } catch (error) {
        logger.error('Failed to start server', { error: error as Error });

        // If we have a server, register it with ShutdownManager for cleanup
        if (httpServer) {
            const shutdownManager = ShutdownManager.getInstance();
            shutdownManager.registerServer(httpServer);
        }

        const shutdownManager = ShutdownManager.getInstance();
        await shutdownManager.initiateShutdown({ timeoutMs: 30000, exitCode: 1 });
    }
};

run();
