---
name: sse-streaming
description: Implement Server-Sent Events (SSE) endpoints using req.context.emitter, openSSE, sendSSE, and the close-listener cleanup pattern. Covers header setup, WebKit priming, event listener registration, replay of previously emitted events on reconnect, and mandatory listener teardown. Use when adding a new SSE stream endpoint or modifying the jobs stream.
---

# Purpose

Implement SSE endpoints correctly — headers, initial state flush, live event forwarding, reconnect replay, and leak-free listener cleanup.

# When To Use

- Adding a new SSE streaming endpoint.
- Extending the `streamJobs` endpoint with additional event types.
- Debugging SSE connections that do not close cleanly or leak listeners.

# Required Patterns

## Open the stream with `openSSE`

Always open via `openSSE` from `aop/http/sse` — do not set SSE headers in the controller:

```typescript
import { openSSE, sendSSE } from 'aop/http/sse';

openSSE(res);  // headers, WebKit comment, flush
```

`openSSE` sets:

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform` — `no-transform` stops proxies from rewriting the stream
- `Connection: keep-alive`
- `X-Accel-Buffering: no` — stops nginx from buffering

It then calls `res.flushHeaders()`, writes a ≥2KB priming SSE **comment** (no trailing blank line) so WebKit's fetch stream releases bytes, disables Nagle on the socket, and flushes. The comment must **not** end with a blank line: a dispatched empty frame makes `JSON.parse` throw in the frontend stream client on every browser.

## sendSSE helper

All event writes use `sendSSE` from `aop/http/sse`. Each call prefixes the same ≥2KB comment, serializes the payload, and flushes — WebKit otherwise holds small live frames until later traffic arrives:

```typescript
import { sendSSE } from 'aop/http/sse';

sendSSE(res, payload);  // serializes payload to SSE format and flushes
```

## Event listener pattern

Register typed listeners on `req.context.emitter` and remove them on connection close:

```typescript
const onEvent = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFinished]) => {
    if (event.userId === req.context.user.id) {
        sendSSE(res, event);
    }
};

req.context.emitter.on(constants.events.jobs.jobFinished, onEvent);

req.on('close', () => {
    req.context.emitter.off(constants.events.jobs.jobFinished, onEvent);
});
```

Key rules:
- Filter events by `event.userId === req.context.user.id` — never broadcast across users.
- Save each handler reference as a `const` so the same reference can be passed to `.off()`.
- Always register the `req.on('close', ...)` cleanup immediately after `.on()`.

## Initial state flush on connect

Before registering live listeners, send any state that the client needs immediately on connect (e.g. currently running jobs, previously emitted events):

```typescript
// 1. Flush current running job IDs for this user
const runningJobIds = [...req.context.delegator.runningJobs.entries()]
    .filter(([, job]) => job.payload.userId === req.context.user.id)
    .map(([jobId]) => jobId);

sendSSE(res, { runningJobs: runningJobIds, type: constants.events.jobs.runningJobs });

// 2. Replay any previously emitted target events for running jobs
for (const event of req.context.emitter.getEmittedJobTargetEventsForUser(req.context.user.id)) {
    if (req.context.delegator.runningJobs.has(event.jobId)) {
        sendSSE(res, event);
    }
}

// 3. Register live listeners
```

Replay individually (not batched) to match the format and ordering of live events.

# Implementation Steps

## Adding a new SSE endpoint

1. Create a synchronous controller function — SSE does not use `async`.
2. Call `openSSE(res)` immediately (headers, WebKit comment, flush).
3. Send initial state if applicable.
4. For each event type: define a typed handler const, call `req.context.emitter.on(eventName, handler)`, and register `req.on('close', () => req.context.emitter.off(eventName, handler))`.
5. Add the route to `<module>-routing.ts` — SSE routes should be protected by `authenticateContextMiddleware`.

## Extending the existing jobs stream

1. Add the new event type constant to `shared/constants/events`.
2. Add the payload type to `EventTypeToPayloadMap` in `shared/types/jobs/events/`.
3. Emit the new event from the delegator or emitter at the appropriate place.
4. In `streamJobs`, add a new handler + listener + cleanup following the existing pattern.

# Examples

## Complete minimal SSE controller

```typescript
import { Request, Response } from 'express';
import { openSSE, sendSSE } from 'aop/http/sse';
import constants from 'shared/constants';
import type { EventTypeToPayloadMap } from 'shared/types/jobs/events/types-jobs-events';

const streamJobs = (req: Request, res: Response) => {
    openSSE(res);

    // Initial state
    const runningJobIds: string[] = [];
    for (const [jobId, job] of req.context.delegator.runningJobs.entries()) {
        if (job.payload.userId === req.context.user.id) runningJobIds.push(jobId);
    }
    sendSSE(res, { runningJobs: runningJobIds, type: constants.events.jobs.runningJobs });

    // Live listeners
    const onJobFinished = (event: EventTypeToPayloadMap[typeof constants.events.jobs.jobFinished]) => {
        if (event.userId === req.context.user.id) sendSSE(res, event);
    };
    req.context.emitter.on(constants.events.jobs.jobFinished, onJobFinished);

    req.on('close', () => {
        req.context.emitter.off(constants.events.jobs.jobFinished, onJobFinished);
    });
};

export { streamJobs };
```

## Frontend — consuming the stream

The frontend uses `@microsoft/fetch-event-source` via `api/service/client/stream.ts` with `openWhenHidden: true`. Skip frames with empty `data` before `JSON.parse`. See the frontend `api-client-patterns` skill for stream consumption patterns.

# Edge Cases

- **Listener memory leak**: If `req.on('close', ...)` is not registered, listeners accumulate for every client connection. Node.js will warn at 11+ listeners on the same emitter event. Always clean up.
- **Reconnect replay**: Use `getEmittedJobTargetEventsForUser(userId)` for reconnect buffer. On reconnect, replay only events where the job is still running (`delegator.runningJobs.has(event.jobId)`) to avoid stale data.
- **Synchronous controller**: SSE controllers are synchronous (no `async`). Do not `await` in the handler — it blocks `openSSE` / `res.flushHeaders()`.
- **User scoping**: The emitter broadcasts to all listeners; filter by `event.userId` on every event. Never send another user's events to the current connection.
- **WebKit / proxy buffering**: Safari's fetch stream holds small chunks until more data arrives. `openSSE` / `sendSSE` prefix a ≥2KB comment (no trailing blank line) and flush with `setNoDelay`. Missing `no-transform` or `X-Accel-Buffering: no` can hide the same events behind a proxy.

# Anti-Patterns

- **Never** omit `openSSE(res)` — without it, headers are not flushed and WebKit may not deliver live events.
- **Never** end the priming comment with a blank line (`\n\n`) — that dispatches an empty frame and `JSON.parse` throws on the client.
- **Never** use an anonymous function for event listeners — you cannot call `.off()` with an anonymous reference.
- **Never** skip the `req.on('close', ...)` cleanup — every uncleaned listener is a memory leak.
- **Never** emit events to a connection without filtering by `userId`.
- **Never** batch replay events — emit them individually to preserve format and ordering.
- **Never** make SSE controller functions `async` — SSE uses a persistent connection; `async` adds no value and can mask the synchronous flush.

# Validation Checklist

- [ ] `openSSE(res)` called (headers include `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`; WebKit comment is ≥2KB and has no trailing blank line)
- [ ] Initial state sent before registering live listeners
- [ ] Each handler stored as a `const` for `.off()` reference
- [ ] `req.on('close', ...)` cleanup registered for every listener
- [ ] All events filtered by `event.userId === req.context.user.id`
- [ ] `sendSSE` used for all event writes — no raw `res.write()` in the controller
- [ ] Controller is synchronous (not `async`)
- [ ] Route protected by `authenticateContextMiddleware`
