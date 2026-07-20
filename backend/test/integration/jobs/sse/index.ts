import constants from 'shared/constants';

import type { JobsAggregatedStream, JobsEvent } from '../types';
import type { IncomingMessage } from 'http';

import { getAgent } from '../../harness';

/**
 * Parses an SSE buffer into event/data pairs.
 */
function parseJobsEvents(buffer: string): JobsEvent[] {
    return buffer
        .split('\n\n')
        .filter(Boolean)
        .map(chunk => {
            const lines = chunk.split('\n');
            const eventLine = lines.find(line => line.startsWith('event: ')) ?? '';
            const dataLine = lines.find(line => line.startsWith('data: ')) ?? '';

            return {
                event: eventLine.replace('event: ', ''),
                data: JSON.parse(dataLine.replace('data: ', '') || '{}') as Record<string, unknown>,
            };
        });
}

/**
 * Opens `GET /jobs/stream-all`, reads until the connect `jobs-aggregated` event arrives, then closes.
 */
async function readJobsAggregatedStream(
    agent: ReturnType<typeof getAgent>,
    token: string,
    timeoutMs = 20_000
): Promise<JobsAggregatedStream> {
    const aggregatedType = constants.events.jobs.jobsAggregated;

    return new Promise((resolve, reject) => {
        let buffer = '';
        let settled = false;
        let response: IncomingMessage | undefined;

        const succeed = (value: JobsAggregatedStream) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            response?.destroy();
            resolve(value);
        };

        const fail = (reason: unknown) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            response?.destroy();
            reject(reason);
        };

        const timeout = setTimeout(() => {
            fail(new Error(`SSE timeout waiting for ${aggregatedType}`));
        }, timeoutMs);

        const req = agent.get(constants.routes.jobs.streamAll).set('Authorization', `Bearer ${token}`).buffer(false);

        req.on('response', (res: IncomingMessage) => {
            response = res;

            res.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                const events = parseJobsEvents(buffer);
                const aggregated = events.find(event => event.event === aggregatedType);
                if (!aggregated) {
                    return;
                }

                succeed({
                    status: res.statusCode ?? 0,
                    headers: res.headers,
                    events,
                    aggregated,
                });
            });

            res.on('error', fail);
        });

        req.on('error', fail);

        req.end((error: Error | undefined) => {
            if (error && !error.message.includes('aborted')) {
                fail(error);
            }
        });
    });
}

export { parseJobsEvents, readJobsAggregatedStream };
