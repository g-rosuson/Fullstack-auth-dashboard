/**
 * Per-run cancellation handle owned by Delegator.
 *
 * Tools and targets receive {@link Aborter.signal}; the stop endpoint calls
 * {@link Aborter.cancel} via `delegator.cancel(jobId)`. Distinct from
 * {@link DelegatorContext}, which is the HTTP-facing facade.
 */
export class Aborter {
    private controller = new AbortController();

    /**
     * AbortSignal threaded into tools and targets.
     */
    get signal(): AbortSignal {
        return this.controller.signal;
    }

    /**
     * Whether cancellation has been requested.
     */
    get cancelled(): boolean {
        return this.signal.aborted;
    }

    /**
     * Request cancellation. Idempotent.
     */
    cancel(): void {
        this.controller.abort();
    }
}
