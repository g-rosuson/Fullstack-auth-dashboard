import { Response } from 'express';

import type { EventType } from 'aop/emitter/types';

import type { EventTypeToPayloadMap } from 'shared/types/jobs/events/types-jobs-events';

type FlushableResponse = Response & { flush?: () => void };

/**
 * Pushes buffered bytes to the client. `flush` is present when compression
 * (or a similar middleware) is mounted; without it the write is already unbuffered.
 */
const flushSSE = (res: FlushableResponse) => {
    res.flush?.();
};

/**
 * Opens an SSE response: anti-buffering headers, then a WebKit-priming comment
 * that is **not** a dispatched frame (no trailing blank line — that would make
 * `JSON.parse` throw on empty `data` in the frontend stream client).
 */
const openSSE = (res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(': connected\n');
    flushSSE(res);
};

const sendSSE = <T extends EventType>(res: Response, event: EventTypeToPayloadMap[T]) => {
    res.write(`event: ${event.type}\n` + `data: ${JSON.stringify(event)}\n\n`);
    flushSSE(res);
};

export { openSSE, sendSSE };
