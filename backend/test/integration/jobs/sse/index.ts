import constants from 'shared/constants';

import type { Agent, JobsAggregatedStream, JobsEvent, JobsMatchedStream, ReadJobsStreamOptions } from '../types';
import type { IncomingMessage } from 'http';

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
 * Opens the jobs SSE stream and resolves when `match` finds an event.
 * `afterConnect` runs once the connect `jobs-aggregated` snapshot has arrived.
 */
async function readJobsStreamUntilMatch(
    agent: Agent,
    token: string,
    { match, afterConnect, timeoutMs = 20_000 }: ReadJobsStreamOptions
): Promise<JobsMatchedStream> {
    return new Promise((resolve, reject) => {
        let buffer = '';
        let settled = false;
        let response: IncomingMessage | undefined;
        let afterConnectStarted = false;

        const settle = (result?: JobsMatchedStream, error?: unknown) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            response?.destroy();
            if (error !== undefined) {
                reject(error);
            } else {
                resolve(result!);
            }
        };

        const timer = setTimeout(
            () => settle(undefined, new Error('SSE timeout waiting for matched event')),
            timeoutMs
        );

        const onData = (status: number, headers: IncomingMessage['headers']) => {
            const events = parseJobsEvents(buffer);

            if (
                afterConnect &&
                !afterConnectStarted &&
                events.some(event => event.event === constants.events.jobs.jobsAggregated)
            ) {
                afterConnectStarted = true;
                afterConnect().catch(error => settle(undefined, error));
            }

            const matched = events.find(match);
            if (matched) {
                settle({ status, headers, events, matched });
            }
        };

        const req = agent.get(constants.routes.jobs.streamAll).set('Authorization', `Bearer ${token}`).buffer(false);

        req.on('response', (res: IncomingMessage) => {
            response = res;
            res.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                onData(res.statusCode ?? 0, res.headers);
            });
            res.on('error', error => settle(undefined, error));
        });

        req.on('error', error => settle(undefined, error));
        req.end((error: Error | undefined) => {
            if (error && !error.message.includes('aborted')) {
                settle(undefined, error);
            }
        });
    });
}

/**
 * Opens `GET /jobs/stream-all`, reads until the connect `jobs-aggregated` event, then closes.
 */
async function readJobsAggregatedStream(
    agent: Agent,
    token: string,
    timeoutMs = 20_000
): Promise<JobsAggregatedStream> {
    const { status, headers, events, matched } = await readJobsStreamUntilMatch(agent, token, {
        match: event => event.event === constants.events.jobs.jobsAggregated,
        timeoutMs,
    });

    return { status, headers, events, aggregated: matched };
}

export { parseJobsEvents, readJobsAggregatedStream, readJobsStreamUntilMatch };
