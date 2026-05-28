import { Server } from 'http';

import { logger } from 'aop/logging';

import config from 'config';

import server from 'server';
import { ShutdownManager } from 'server/server-shutdown-manager';

const run = async (): Promise<void> => {
    let httpServer: Server | null = null;

    try {
        const app = await server.init();
        const port = config.port ?? 1000;

        ('[E2E-DEBUG] reconsider how httpServer is defined as a variable');
        httpServer = app.listen(port, '0.0.0.0', () => undefined);

        httpServer.on('listening', () => {
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
            logger.info(`🚀 Server listening on port ${port}`);
        });

        httpServer.on('error', error => {
            // BEGIN E2E-DEBUG — remove after CI root-cause is fixed
            logger.error('[E2E-DEBUG] HTTP server listen error', { error: error as Error });
            // END E2E-DEBUG
            logger.error('Failed to start HTTP server', { error: error as Error });
            process.exit(1);
        });

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
