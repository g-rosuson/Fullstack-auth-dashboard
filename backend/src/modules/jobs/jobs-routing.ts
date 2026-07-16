import { Router } from 'express';

import { forwardSyncError } from 'aop/http/middleware/sync';

import {
    changeJobScheduleStatus,
    createJob,
    deleteJob,
    getAllJobs,
    getJob,
    retryJobSchedule,
    stopJob,
    streamJobs,
    updateJob,
} from './jobs-controller';
import {
    validateChangeScheduleStatusPayload,
    validateCreateOrUpdateJobPayload,
    validateIdQueryParams,
    validatePaginationQueryParams,
} from './jobs-middleware';

import constants from 'shared/constants';

// Determine router
const router = Router();

// Determine routes
router.post(constants.routes.jobs.create, validateCreateOrUpdateJobPayload, createJob);
router.get(constants.routes.jobs.getAll, forwardSyncError(validatePaginationQueryParams), getAllJobs);
router.get(constants.routes.jobs.getById, forwardSyncError(validateIdQueryParams), getJob);
router.put(
    constants.routes.jobs.update,
    forwardSyncError(validateCreateOrUpdateJobPayload),
    forwardSyncError(validateIdQueryParams),
    updateJob
);
router.put(
    constants.routes.jobs.changeScheduleStatus,
    forwardSyncError(validateIdQueryParams),
    forwardSyncError(validateChangeScheduleStatusPayload),
    changeJobScheduleStatus
);
router.post(constants.routes.jobs.retrySchedule, forwardSyncError(validateIdQueryParams), retryJobSchedule);
router.post(constants.routes.jobs.stop, forwardSyncError(validateIdQueryParams), stopJob);
router.delete(constants.routes.jobs.delete, forwardSyncError(validateIdQueryParams), deleteJob);
router.get(constants.routes.jobs.streamAll, forwardSyncError(streamJobs));

export default router;
