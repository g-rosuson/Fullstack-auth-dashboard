import type { ActionType, JobStatus, Schedule } from '../types';
import type { MapToScheduleParams, MapToStatusParams } from './types';

import { JobScheduleStatus, JobScheduleType } from '@/_types/_gen';
import jobListConstants from '@/components/pages/jobs/components/jobsList/constants';
import utils from '@/utils';

/**
 * Derives the job lifecycle status key from schedule + execution state.
 *
 * - Running overrides schedule state.
 * - Once: `active`/`paused` while awaiting `startDate`; `inactive` after.
 * - Recurring: `missing` without a stream entry; `inactive` past `endDate`;
 *   otherwise stream status (`stopped` → `paused`, else `active`).
 */
const mapToStatus = ({ persistedSchedule, streamSchedule, isRunning }: MapToStatusParams): JobStatus => {
    if (isRunning) {
        return 'running';
    }

    if (!persistedSchedule) {
        return 'inactive';
    }

    const nowInMs = Date.now();

    // Once: in the stream until fire; absence after start is expected (not Missing).
    if (persistedSchedule.type === JobScheduleType.once) {
        const isAwaitingStart = new Date(persistedSchedule.startDate).getTime() > nowInMs;

        if (!isAwaitingStart) {
            return 'inactive';
        }

        return persistedSchedule.status === JobScheduleStatus.stopped ? 'paused' : 'active';
    }

    // Recurring: persisted schedule with no matching in-memory stream entry.
    if (!streamSchedule) {
        return 'missing';
    }

    // No endDate means the window stays open indefinitely.
    const endDateInMs = persistedSchedule.endDate ? new Date(persistedSchedule.endDate).getTime() : null;
    const isScheduleWindowOpen = endDateInMs === null || endDateInMs > nowInMs;

    if (!isScheduleWindowOpen) {
        return 'inactive';
    }

    return streamSchedule.status === JobScheduleStatus.stopped ? 'paused' : 'active';
};

/**
 * Maps lifecycle status to the primary confirmable action.
 *
 * Status is the source of truth — button labels and confirmation intent both
 * derive from this table.
 */
const mapToActionType = (status: JobStatus): ActionType => {
    const { action } = jobListConstants.key;

    const statusToAction = {
        running: action.execution.stop,
        active: action.schedule.pause,
        paused: action.schedule.activate,
        inactive: action.execution.run,
        missing: action.schedule.retry,
    } as const satisfies Record<JobStatus, ActionType>;

    return statusToAction[status];
};

/**
 * Maps a job (+ optional stream schedule) to display fields for the job card.
 *
 * - No schedule: `type` is null; `startDate` / `lastRun` come from first / last execution `delegatedAt`.
 * - Once: stream `nextRun`/`lastRun` are always null (no cron expression); `nextRun` is `startDate` while ahead, `lastRun` from last execution.
 * - Recurring: `startDate` / `endDate` from the persisted schedule; `nextRun` / `lastRun` from the stream event.
 */
const mapToSchedule = ({ job, streamSchedule }: MapToScheduleParams): Schedule => {
    const empty = jobListConstants.label.empty;
    const firstExecution = job.executions?.[0];
    const lastExecution = job.executions?.[job.executions.length - 1];
    // Shared by no-schedule and once jobs (recurring overrides with stream values).
    const formattedLastRun = utils.time.formatDate(lastExecution?.schedule.delegatedAt || '') || empty;

    // Manual / on-demand job — no persisted schedule.
    if (!job.schedule) {
        const startDateWithoutSchedule = utils.time.formatDate(firstExecution?.schedule.delegatedAt || '') || empty;
        return {
            type: null,
            startDate: startDateWithoutSchedule,
            endDate: empty,
            nextRun: empty,
            lastRun: formattedLastRun,
        };
    }

    const { type, startDate, endDate } = job.schedule;
    const formattedStartDate = utils.time.formatDate(startDate) || empty;

    // Once — in memory until fire, but stream next/last run are unused (always null).
    if (type === JobScheduleType.once) {
        const isStartDateInTheFuture = new Date(startDate).getTime() > Date.now();

        return {
            type: 'Once',
            startDate: formattedStartDate,
            endDate: empty,
            nextRun: isStartDateInTheFuture ? formattedStartDate : empty,
            lastRun: formattedLastRun,
        };
    }

    // Recurring — live next/last run come from the aggregated jobs stream.
    const formattedEndDate = utils.time.formatDate(endDate || '') || empty;
    const formattedNextRunFromStream = utils.time.formatDate(streamSchedule?.nextRun || '') || empty;
    const formattedLastRunFromStream = utils.time.formatDate(streamSchedule?.lastRun || '') || empty;

    return {
        type: utils.string.capitalize(JobScheduleType[type]),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        nextRun: formattedNextRunFromStream,
        lastRun: formattedLastRunFromStream,
    };
};

const mappers = {
    mapToStatus,
    mapToActionType,
    mapToSchedule,
};

export default mappers;
