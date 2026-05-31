import type { Delegator } from 'aop/delegator';

/**
 * DelegatorContext exposes delegator capabilities to the HTTP layer.
 * It provides a thin wrapper around the delegator singleton so that
 * request handlers can trigger background jobs in a consistent way.
 */
export class DelegatorContext {
    delegate;
    register;
    removeJob;
    runningJobs;

    /**
     * Creates a new DelegatorContext instance with bound methods.
     * @param delegator Delegator singleton instance
     */
    constructor(delegator: Delegator) {
        this.delegate = delegator.delegate;
        this.register = delegator.register;
        this.removeJob = delegator.removeJob;
        this.runningJobs = delegator.runningJobs;
    }
}
