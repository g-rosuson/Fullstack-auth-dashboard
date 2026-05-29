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

        // Explicit IPv4 bind: '0.0.0.0' listens on every interface, not only loopback.
        // - Prod Docker: Caddy reaches backend over the container network (not 127.0.0.1).
        // - CI/local: curl health checks hit 127.0.0.1; listen(port) with no host on Linux
        //   often binds IPv6 (::) only, so IPv4 localhost gets connection refused.
        httpServer = app.listen(port, '0.0.0.0', () => {
            logger.info(`🚀 Server listening on port ${port}`);
        });

        httpServer.on('error', error => {
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
