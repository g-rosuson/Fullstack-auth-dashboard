import type { Scheduler } from 'aop/scheduler';

/**
 * SchedulerContext serves as the main scheduler abstraction layer for the application.
 * It encapsulates the scheduler instance and exposes domain-specific methods
 *
 * Key responsibilities:
 * - Wraps the scheduler instance
 * - Provides access to domain methods (e.g., schedule, delete, etc.)
 * - Maintains consistent scheduler access patterns across the application
 * - Enables easy testing through dependency injection
 */
export class SchedulerContext {
    schedule;
    delete;
    getNextAndPreviousRun;
    getNextRunFromPersistedSchedule;
    getCronJobEventsForUser;

    /**
     * Constructs a new SchedulerContext instance.
     * Initializes all domain methods with the provided scheduler instance.
     * @param scheduler The scheduler instance to wrap and provide to methods
     */
    constructor(scheduler: Scheduler) {
        this.schedule = scheduler.schedule.bind(scheduler);
        this.delete = scheduler.delete.bind(scheduler);
        this.getNextAndPreviousRun = scheduler.getNextAndPreviousRun.bind(scheduler);
        this.getNextRunFromPersistedSchedule = scheduler.getNextRunFromPersistedSchedule.bind(scheduler);
        this.getCronJobEventsForUser = scheduler.getCronJobEventsForUser.bind(scheduler);
    }
}
