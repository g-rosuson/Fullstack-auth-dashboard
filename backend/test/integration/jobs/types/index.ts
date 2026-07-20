import { IncomingMessage } from 'http';

type JobsEvent = { event: string; data: Record<string, unknown> };

type JobsAggregatedStream = {
    status: number;
    headers: IncomingMessage['headers'];
    events: JobsEvent[];
    aggregated: JobsEvent;
};

export { JobsEvent, JobsAggregatedStream };
