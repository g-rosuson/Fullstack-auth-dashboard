import { NextFunction, Request, Response } from 'express';

import { validateRequestPayload } from 'aop/http/validators/validators-request-payload';

import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';

import {
    changeJobScheduleStatusPayloadSchema,
    createJobInputSchema,
    idRouteParamSchema,
    paginatedRouteParamSchema,
    updateJobInputSchema,
} from './schemas';
import { validateToolsSchema } from './validators/jobs-validators';

/**
 * Validates create/update job body (schema + tools + schedule rules).
 *
 * FR-JOBS-TLR-001…006 — Tool presence, types, keywords/maxPages/subject/body, stable ids
 * FR-JOBS-SCH-001 / SCH-002 / SCH-003 / SCH-006 — Schedule set/change validity (start, end, types, expired end)
 * FR-JOBS-ONCE-001 — Once schedules must not include an end time
 */
const validateCreateOrUpdateJobPayload = (req: Request, _res: Response, next: NextFunction) => {
    const schema = req.path === constants.routes.jobs.create ? createJobInputSchema : updateJobInputSchema;

    const validatedPayload = validateRequestPayload(schema, req.body, ErrorMessage.JOBS_SCHEMA_VALIDATION_FAILED);

    validateToolsSchema(validatedPayload);

    req.body = validatedPayload;

    next();
};

/**
 * Validates change-schedule-status body (`status` = idle | stopped).
 *
 * FR-JOBS-SSC-001 — Owner may set schedule status to active (`idle`) or stopped
 */
const validateChangeScheduleStatusPayload = (req: Request, _res: Response, next: NextFunction) => {
    const validatedPayload = validateRequestPayload(
        changeJobScheduleStatusPayloadSchema,
        req.body,
        ErrorMessage.JOBS_SCHEMA_VALIDATION_FAILED
    );

    req.body = validatedPayload;

    next();
};

/**
 * Validates `:id` path params for id-scoped job routes.
 *
 * FR-JOBS-GET-001 — Job identity required to fetch (and shared by update/delete/status/retry params)
 */
const validateIdQueryParams = (req: Request, _res: Response, next: NextFunction) => {
    const validatedPayload = validateRequestPayload(
        idRouteParamSchema,
        req.params,
        ErrorMessage.JOBS_SCHEMA_VALIDATION_FAILED
    );

    req.params = validatedPayload;

    next();
};

/**
 * Validates list pagination query (`limit`, `offset`).
 *
 * FR-JOBS-LST-002 — Limit and offset the list of jobs
 */
const validatePaginationQueryParams = (req: Request, _res: Response, next: NextFunction) => {
    const validatedPayload = validateRequestPayload(
        paginatedRouteParamSchema,
        req.query,
        ErrorMessage.JOBS_SCHEMA_VALIDATION_FAILED
    );

    // Merge validated query params into req.query without overwriting the read-only property
    Object.assign(req.query, validatedPayload);

    next();
};

export {
    validateCreateOrUpdateJobPayload,
    validateChangeScheduleStatusPayload,
    validateIdQueryParams,
    validatePaginationQueryParams,
};
