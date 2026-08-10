import { IncomingMessage } from 'http';

import type { getAgent } from '../../harness';

type JobsEvent = { event: string; data: Record<string, unknown> };

type JobsAggregatedStream = {
    status: number;
    headers: IncomingMessage['headers'];
    events: JobsEvent[];
    aggregated: JobsEvent;
};

type JobsMatchedStream = {
    status: number;
    headers: IncomingMessage['headers'];
    events: JobsEvent[];
    matched: JobsEvent;
};

type Agent = ReturnType<typeof getAgent>;

type ReadJobsStreamOptions = {
    // eslint-disable-next-line no-unused-vars
    match: (event: JobsEvent) => boolean;
    afterConnect?: () => Promise<void>;
    timeoutMs?: number;
};

export { JobsEvent, JobsAggregatedStream, JobsMatchedStream, Agent, ReadJobsStreamOptions };
